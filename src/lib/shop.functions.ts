import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, description, price_pkr, image_url, shape, finish, palette")
    .eq("is_active", true)
    .order("price_pkr", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const orderSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  street: z.string().trim().min(3).max(160),
  area: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(10),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+92|0)3\d{2}-?\d{7}$/, "Enter a valid Pakistani mobile number"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        size: z.enum(["XS", "S", "M", "L", "Custom"]),
        customMm: z.string().trim().max(60).nullable(),
        shape: z.enum(["Almond", "Coffin", "Stiletto", "Square"]),
        finish: z.enum(["Glossy", "Matte"]),
      }),
    )
    .min(1)
    .max(30),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Prices are always read from the database, never trusted from the client.
    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price_pkr")
      .in("id", ids)
      .eq("is_active", true);
    if (productError) throw new Error(productError.message);
    if (!products || products.length !== ids.length) {
      throw new Error("One or more items are no longer available.");
    }
    const byId = new Map(products.map((p) => [p.id, p]));

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("discount_code, discount_percent, free_delivery")
      .eq("id", userId)
      .maybeSingle();

    let subtotal = 0;
    for (const item of data.items) {
      subtotal += byId.get(item.productId)!.price_pkr * item.quantity;
    }

    const percent = Math.min(Math.max(profile?.discount_percent ?? 0, 0), 100);
    const discount = Math.round((subtotal * percent) / 100);
    const delivery = profile?.free_delivery ? 0 : 250;
    const total = subtotal - discount + delivery;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        full_name: data.fullName,
        street: data.street,
        area: data.area,
        city: data.city,
        postal_code: data.postalCode,
        phone: data.phone,
        subtotal_pkr: subtotal,
        discount_pkr: discount,
        delivery_pkr: delivery,
        total_pkr: total,
        discount_code: percent > 0 || profile?.free_delivery ? profile?.discount_code ?? null : null,
      })
      .select("id, total_pkr")
      .single();
    if (orderError) throw new Error(orderError.message);

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      data.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: byId.get(item.productId)!.name,
        unit_price_pkr: byId.get(item.productId)!.price_pkr,
        quantity: item.quantity,
        size: item.size,
        custom_mm: item.customMm,
        shape: item.shape,
        finish: item.finish,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    // A spin reward can only be used once.
    if (percent > 0 || profile?.free_delivery) {
      await supabaseAdmin
        .from("profiles")
        .update({ discount_code: null, discount_percent: 0, free_delivery: false })
        .eq("id", userId);
    }

    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone })
      .eq("id", userId);

    return { orderId: order.id, total: order.total_pkr, subtotal, discount, delivery };
  });