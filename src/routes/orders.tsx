import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatPKR } from "@/lib/money";
import { loadOrders, loadVouchers, type MockOrder, type Voucher } from "@/lib/mock-store";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My orders — Nail by Muskii" },
      {
        name: "description",
        content: "Track the press-on nail sets you have ordered from Nail by Muskii.",
      },
      { property: "og:title", content: "My orders — Nail by Muskii" },
      { property: "og:description", content: "Your order history and delivery status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Orders,
});

function Orders() {
  const [orders, setOrders] = useState<MockOrder[] | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [tab, setTab] = useState<"orders" | "vouchers">("orders");

  useEffect(() => {
    setOrders(loadOrders());
    setVouchers(loadVouchers());
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">My account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Orders and vouchers in this demo are kept in your browser.
      </p>

      <div className="mt-5 flex gap-2" role="tablist" aria-label="Account sections">
        {(
          [
            { key: "orders", label: "My Orders" },
            { key: "vouchers", label: "My Vouchers" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`min-h-12 rounded-md border px-4 text-sm font-semibold ${
              tab === item.key
                ? "border-gold-deep bg-gold text-accent-foreground"
                : "border-border bg-card hover:bg-secondary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "vouchers" ? (
        vouchers.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No vouchers yet. Spin the Lucky Spin wheel to win discount codes.
          </p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {vouchers.map((voucher) => (
              <li
                key={voucher.code}
                className={`rounded-lg border p-4 ${
                  voucher.used ? "border-border bg-secondary opacity-60" : "border-gold bg-card"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-base font-bold tracking-wide">{voucher.code}</p>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                      voucher.used ? "bg-muted text-muted-foreground" : "bg-gold text-accent-foreground"
                    }`}
                  >
                    {voucher.used ? "Used" : "Active"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {voucher.prize_label} · won{" "}
                  {new Date(voucher.won_at).toLocaleDateString("en-PK")}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : orders === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You have not placed an order yet.{" "}
          <Link to="/" className="font-semibold text-gold-deep underline">
            Browse sets
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                  {order.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("en-PK")} · {order.city}
              </p>
              <p className="mt-2 text-xs font-semibold text-primary">
                {order.payment_method ?? "Easypaisa / JazzCash"} · Payment: {order.payment_status ?? order.status}
              </p>
              {order.voucher_code ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Voucher applied: {order.voucher_code}
                </p>
              ) : null}
              <ul className="mt-3 grid gap-1 text-sm">
                {order.items.map((item, index) => (
                  <li key={`${item.product_name}-${index}`} className="flex justify-between gap-3">
                    <span>
                      {item.product_name} · {item.size} · {item.shape} · {item.finish} ×{" "}
                      {item.quantity}
                    </span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {formatPKR(item.unit_price_pkr * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-border pt-3 text-sm font-bold text-gold-deep">
                Total {formatPKR(order.total_pkr)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
