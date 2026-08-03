import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useReward } from "@/hooks/useReward";
import { formatPKR, DELIVERY_PKR } from "@/lib/money";
import { buildOrder, saveOrder } from "@/lib/mock-store";
import { cleanText, PK_PHONE_REGEX } from "@/lib/sanitize";

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
            if (phoneValid) placeOrder();
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

          <div className="flex gap-3">
            <Button size="touch" variant="outline" type="button" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button size="touch" type="submit" disabled={!phoneValid}>
              Place order
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}