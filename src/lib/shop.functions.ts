import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MOCK_PRODUCTS } from "@/lib/mock-catalog";
import { DELIVERY_PKR } from "@/lib/money";

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(2)
    .max(max)
    .transform((v) => v.replace(/[<>]/g, ""));

const OrderInput = z.object({
  address: z.object({
    fullName: text(100),
    street: text(160),
    area: text(100),
    city: text(80),
    postalCode: z.string().trim().regex(/^\d{4,10}$/),
  }),
  phone: z.string().trim().regex(/^(\+92|0)3\d{2}-?\d{7}$/),
  orderKey: z.string().uuid(),
  paymentMethod: z.enum(["Easypaisa", "JazzCash", "Bank Transfer"]),
  senderName: text(100),
  senderAccount: z.string().trim().regex(/^[A-Za-z0-9+\- ]{6,34}$/),
  transactionId: z.string().regex(/^\d{11}$/),
  voucherCode: z.string().max(40).nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(120),
        quantity: z.number().int().min(1).max(20),
        size: z.string().max(10),
        customMm: z.string().max(60).nullable(),
        shape: z.string().max(20),
        finish: z.string().max(20),
      }),
    )
    .min(1)
    .max(30),
});

export const placeShopOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => OrderInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: ban } = await supabaseAdmin.from("customer_bans").select("user_id").eq("user_id", userId).maybeSingle();
    if (ban) throw new Error("Your account is banned from placing orders.");

    // One payment per order: a repeat submit for the same order is ignored.
    const { data: existing } = await supabaseAdmin
      .from("shop_orders")
      .select("id,total_pkr,user_id")
      .eq("id", data.orderKey)
      .maybeSingle();
    if (existing) {
      if (existing.user_id !== userId) throw new Error("Invalid order.");
      return { id: existing.id, total: existing.total_pkr, alreadySubmitted: true };
    }
    const { data: usedTrx } = await supabaseAdmin
      .from("shop_orders")
      .select("id")
      .eq("transaction_id", data.transactionId)
      .maybeSingle();
    if (usedTrx) throw new Error("This Transaction ID has already been used.");

    // Prices always come from the server, never from the browser.
    const customIds = data.items.map((i) => i.productId).filter((id) => /^[0-9a-f-]{36}$/.test(id));
    const { data: customs } = customIds.length
      ? await supabaseAdmin.from("custom_products").select("id,name,price_pkr").in("id", customIds)
      : { data: [] as { id: string; name: string; price_pkr: number }[] };
    const { data: inv } = await supabaseAdmin.from("product_inventory").select("*");
    const invMap = new Map((inv ?? []).map((r) => [r.product_ref, r]));

    const lines = data.items.map((item) => {
      const product =
        MOCK_PRODUCTS.find((p) => p.id === item.productId) ?? customs?.find((p) => p.id === item.productId);
      if (!product) throw new Error("A product in your cart is no longer available.");
      const stock = invMap.get(item.productId);
      if (stock && ((stock.stock !== null && stock.stock < item.quantity) || stock.oos_sizes.includes(item.size))) {
        throw new Error(`${product.name} is out of stock.`);
      }
      return {
        product_id: item.productId,
        product_name: product.name,
        unit_price_pkr: product.price_pkr,
        quantity: item.quantity,
        size: item.size,
        custom_mm: item.customMm ? item.customMm.replace(/[<>]/g, "") : null,
        shape: item.shape,
        finish: item.finish,
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.unit_price_pkr * l.quantity, 0);
    let percent = 0;
    let freeDelivery = false;
    let voucherCode: string | null = null;
    if (data.voucherCode) {
      const { data: v } = await supabaseAdmin
        .from("user_vouchers")
        .select("*")
        .eq("user_id", userId)
        .eq("code", data.voucherCode)
        .eq("used", false)
        .maybeSingle();
      if (v) {
        percent = v.discount_percent;
        freeDelivery = v.free_delivery;
        voucherCode = v.code;
      }
    }
    const discount = Math.round((subtotal * percent) / 100);
    const delivery = freeDelivery ? 0 : DELIVERY_PKR;

    const { data: order, error } = await supabaseAdmin
      .from("shop_orders")
      .insert({
        id: data.orderKey,
        user_id: userId,
        email: (context.claims as { email?: string }).email ?? null,
        full_name: data.address.fullName,
        street: data.address.street,
        area: data.address.area,
        city: data.address.city,
        postal_code: data.address.postalCode,
        phone: data.phone,
        items: lines,
        subtotal_pkr: subtotal,
        discount_pkr: discount,
        delivery_pkr: delivery,
        total_pkr: subtotal - discount + delivery,
        voucher_code: voucherCode,
        payment_method: data.paymentMethod,
        sender_name: data.senderName,
        sender_account: data.senderAccount,
        transaction_id: data.transactionId,
        payment_status: "Pending Verification",
      })
      .select("id,total_pkr")
      .single();
    if (error?.code === "23505") {
      if (error.message.includes("pkey")) throw new Error("Payment details already submitted for this order.");
      throw new Error("This Transaction ID has already been used.");
    }
    if (error || !order) throw new Error("Could not save your order. Please try again.");

    if (voucherCode) {
      await supabaseAdmin.from("user_vouchers").update({ used: true }).eq("user_id", userId).eq("code", voucherCode);
    }
    for (const line of lines) {
      const stock = invMap.get(line.product_id);
      if (stock && stock.stock !== null) {
        await supabaseAdmin
          .from("product_inventory")
          .update({ stock: Math.max(0, stock.stock - line.quantity) })
          .eq("product_ref", line.product_id);
      }
    }
    return { id: order.id, total: order.total_pkr };
  });
