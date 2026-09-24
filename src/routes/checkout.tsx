import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useReward } from "@/hooks/useReward";
import { formatPKR, DELIVERY_PKR } from "@/lib/money";
import { buildOrder, saveOrder } from "@/lib/mock-store";
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
  const { reward, clearReward } = useReward();
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
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderId: string; total: number } | null>(null);

  const percent = reward?.discount_percent ?? 0;
  const discount = Math.round((subtotal * percent) / 100);
  const delivery = reward?.free_delivery ? 0 : DELIVERY_PKR;

  const placeOrder = () => {
    const order = buildOrder({
      city: cleanText(address.city, 80),
      items,
      subtotal,
      discount,
      delivery,
      transactionId,
    });
    saveOrder(order);
    clear();
    if (percent > 0 || reward?.free_delivery) clearReward();
    setDone({ orderId: order.id, total: order.total_pkr });
  };

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Order placed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order #{done.orderId.slice(0, 8)} · {formatPKR(done.total)}. We will message you on the
          number you gave us to confirm the details.
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

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step {step} of 2 · items subtotal {formatPKR(subtotal)} · delivery{" "}
        {delivery === 0 ? "free" : formatPKR(delivery)}
        {percent > 0 ? ` · ${percent}% spin discount applied` : ""}.
      </p>

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
            if (phoneValid && transactionIdValid) placeOrder();
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

          <section className="border-y border-border py-5">
            <h2 className="text-lg font-bold">Easypaisa / JazzCash</h2>
            <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <span className="text-muted-foreground">Account Title</span>
              <strong>Syed Konain Tahir</strong>
              <span className="text-muted-foreground">Mobile Number</span>
              <strong>03712280570</strong>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <figure className="min-w-0">
                <img
                  src={easypaisaQr.url}
                  alt="Easypaisa payment QR code for Syed Konain Tahir"
                  className="aspect-[4/5] w-full rounded-md border border-border bg-card object-contain"
                />
                <figcaption className="mt-1 text-center text-xs font-bold">Easypaisa</figcaption>
              </figure>
              <figure className="min-w-0">
                <img
                  src={jazzcashQr.url}
                  alt="JazzCash payment QR code for Syed Konain Tahir"
                  className="aspect-[4/5] w-full rounded-md border border-border bg-card object-contain"
                />
                <figcaption className="mt-1 text-center text-xs font-bold">JazzCash</figcaption>
              </figure>
            </div>
          </section>

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
            <Button size="touch" variant="outline" type="button" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button size="touch" type="submit" disabled={!phoneValid || !transactionIdValid}>
              Place order
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}