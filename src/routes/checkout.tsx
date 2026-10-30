import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const METHODS = ["Easypaisa", "JazzCash", "Bank Transfer"] as const;
// Fill in to show bank transfer details at checkout.
const BANK = { name: "", title: "Syed Konain Tahir", iban: "" };
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useReward } from "@/hooks/useReward";
import { formatPKR, DELIVERY_PKR } from "@/lib/money";
import type { Voucher } from "@/lib/mock-store";
import { placeShopOrder } from "@/lib/shop.functions";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { cleanText, PK_PHONE_REGEX } from "@/lib/sanitize";
import easypaisaQr from "@/assets/easypaisa-qr.jpeg.asset.json";
import jazzcashQr from "@/assets/jazzcash-qr.jpeg.asset.json";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Nail by Muskii" },
      {
        name: "description",
        content: "Confirm your delivery address and phone number to place your nail set order.",
      },
      { property: "og:title", content: "Checkout — Nail by Muskii" },
      { property: "og:description", content: "Delivery details and order confirmation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const FIELDS = [
  { key: "fullName", label: "Full name", max: 100, autoComplete: "name" },
  { key: "street", label: "House / street", max: 160, autoComplete: "address-line1" },
  { key: "area", label: "Area", max: 100, autoComplete: "address-line2" },
  { key: "city", label: "City", max: 80, autoComplete: "address-level2" },
  { key: "postalCode", label: "Postal code", max: 10, autoComplete: "postal-code" },
] as const;

type AddressKey = (typeof FIELDS)[number]["key"];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { reward, clearReward, vouchers: allVouchers } = useReward();
  const submitOrder = useServerFn(placeShopOrder);
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState<Record<AddressKey, string>>({
    fullName: "",
    street: "",
    area: "",
    city: "",
    postalCode: "",
  });
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("Easypaisa");
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lockRef = useRef(false);
  const [orderKey] = useState(() => crypto.randomUUID());
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderId: string; total: number } | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");

  const vouchers: Voucher[] = allVouchers.filter((v) => !v.used);
  useEffect(() => {
    if (!selectedVoucher && reward?.discount_code) setSelectedVoucher(reward.discount_code);
  }, [reward, selectedVoucher]);

  const voucher = vouchers.find((v) => v.code === selectedVoucher) ?? null;
  const percent = voucher ? voucher.discount_percent : 0;
  const freeDelivery = voucher ? voucher.free_delivery : false;
  const discount = Math.round((subtotal * percent) / 100);
  const delivery = freeDelivery ? 0 : DELIVERY_PKR;

  const placeOrder = async () => {
    if (lockRef.current) return;
    lockRef.current = true;
    setSubmitting(true);
    try {
      const order = await submitOrder({
        data: {
          address,
          phone,
          orderKey,
          paymentMethod: method,
          senderName,
          senderAccount: senderAccount.trim(),
          transactionId,
          voucherCode: voucher?.code ?? null,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            customMm: i.customMm,
            shape: i.shape,
            finish: i.finish,
          })),
        },
      });
      if (order.alreadySubmitted) toast.info("Payment details already submitted for this order.");
      clear();
      clearReward();
      setDone({ orderId: order.id, total: order.total });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order.");
      lockRef.current = false;
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Order placed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order #{done.orderId.slice(0, 8)} · {formatPKR(done.total)}. Your payment is pending
          verification. We will message you on the number you gave us after checking the payment.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="touch" onClick={() => void navigate({ to: "/orders" })}>
            View my orders
          </Button>
          <Button size="touch" variant="outline" onClick={() => void navigate({ to: "/" })}>
            Keep shopping
          </Button>
        </div>
      </main>
    );
  }

  if (!authLoading && !isLoggedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Sign in to check out</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need an account to place an order.</p>
        <Button size="touch" className="mt-6" onClick={() => void navigate({ to: "/auth" })}>
          Sign in
        </Button>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button size="touch" className="mt-5" onClick={() => void navigate({ to: "/" })}>
          Browse sets
        </Button>
      </main>
    );
  }

  const addressValid = FIELDS.every((field) => cleanText(address[field.key], field.max).length >= 2);
  const phoneValid = PK_PHONE_REGEX.test(phone.trim());
  const transactionIdValid = /^\d{11}$/.test(transactionId);
  const senderAccountValid = /^[A-Za-z0-9+\- ]{6,34}$/.test(senderAccount.trim());
  const formValid =
    phoneValid && transactionIdValid && senderAccountValid && cleanText(senderName, 100).length >= 2;

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step {step} of 2 · items subtotal {formatPKR(subtotal)} · delivery{" "}
        {delivery === 0 ? "free" : formatPKR(delivery)}
        {percent > 0 ? ` · ${percent}% discount applied` : ""}
        {freeDelivery ? " · free delivery applied" : ""}.
      </p>

      {vouchers.length > 0 ? (
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select voucher
          </span>
          <select
            className="min-h-12 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={selectedVoucher}
            onChange={(event) => setSelectedVoucher(event.target.value)}
          >
            <option value="">No voucher</option>
            {vouchers.map((v) => (
              <option key={v.code} value={v.code}>
                {v.code} — {v.prize_label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {step === 1 ? (
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (addressValid) setStep(2);
          }}
        >
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {field.label}
              </span>
              <Input
                className="min-h-12"
                value={address[field.key]}
                maxLength={field.max}
                autoComplete={field.autoComplete}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, [field.key]: event.target.value }))
                }
                required
              />
            </label>
          ))}
          <Button size="touch" type="submit" disabled={!addressValid}>
            Continue to phone number
          </Button>
        </form>
      ) : (
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (formValid) void placeOrder();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active mobile number
            </span>
            <Input
              className="min-h-12"
              inputMode="tel"
              autoComplete="tel"
              placeholder="03xx-xxxxxxx or +923xxxxxxxxx"
              value={phone}
              maxLength={20}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
            {phone.length > 0 && !phoneValid ? (
              <span className="mt-1 block text-xs font-medium text-destructive">
                Enter a Pakistani mobile number, for example 0312-3456789.
              </span>
            ) : null}
          </label>

          <fieldset className="border-t border-border pt-5">
            <legend className="text-lg font-bold">Payment method</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {METHODS.map((m) => (
                <label
                  key={m}
                  className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold has-[:checked]:border-primary"
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>

          <section className="border-b border-border pb-5">
            <h2 className="text-base font-bold">Send payment to</h2>
            {method === "Bank Transfer" ? (
              BANK.iban ? (
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Bank Name</span>
                  <strong>{BANK.name}</strong>
                  <span className="text-muted-foreground">Account Title</span>
                  <strong>{BANK.title}</strong>
                  <span className="text-muted-foreground">IBAN / Account No.</span>
                  <strong className="break-all">{BANK.iban}</strong>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Bank details will be shared soon. Please use Easypaisa or JazzCash for now.
                </p>
              )
            ) : (
              <>
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Account Title</span>
                  <strong>Syed Konain Tahir</strong>
                  <span className="text-muted-foreground">Number</span>
                  <strong>03712280570</strong>
                </div>
                <img
                  src={method === "Easypaisa" ? easypaisaQr.url : jazzcashQr.url}
                  alt={`${method} payment QR code for Syed Konain Tahir`}
                  className="mx-auto mt-4 aspect-[4/5] w-full max-w-60 rounded-md border border-border bg-card object-contain"
                />
              </>
            )}
          </section>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sender account title / name
            </span>
            <Input className="min-h-12" value={senderName} maxLength={100} onChange={(e) => setSenderName(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {method === "Bank Transfer" ? "Sender bank account number / IBAN" : "Sender mobile number"}
            </span>
            <Input className="min-h-12" value={senderAccount} maxLength={34} onChange={(e) => setSenderAccount(e.target.value)} required />
            {senderAccount.length > 0 && !senderAccountValid ? (
              <span className="mt-1 block text-xs font-medium text-destructive">Enter 6–34 letters or digits.</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              11-digit Transaction ID (TRX ID)
            </span>
            <Input
              className="min-h-12"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter 11 digits"
              value={transactionId}
              maxLength={11}
              onChange={(event) => setTransactionId(event.target.value.replace(/\D/g, "").slice(0, 11))}
              required
            />
            {transactionId.length > 0 && !transactionIdValid ? (
              <span className="mt-1 block text-xs font-medium text-destructive">
                Transaction ID must contain exactly 11 digits.
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment screenshot (optional)
            </span>
            <Input
              className="min-h-12 cursor-pointer py-2"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  setReceiptName(null);
                  setReceiptError(null);
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  setReceiptName(null);
                  setReceiptError("Choose an image smaller than 5 MB.");
                  event.target.value = "";
                  return;
                }
                setReceiptName(file.name);
                setReceiptError(null);
              }}
            />
            {receiptName ? <span className="mt-1 block text-xs text-muted-foreground">Selected: {receiptName}</span> : null}
            {receiptError ? <span className="mt-1 block text-xs font-medium text-destructive">{receiptError}</span> : null}
          </label>

          <div className="flex gap-3">
            <Button size="touch" variant="outline" type="button" disabled={submitting} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button size="touch" type="submit" disabled={!formValid || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {submitting ? "Submitting…" : "Confirm Payment"}
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}