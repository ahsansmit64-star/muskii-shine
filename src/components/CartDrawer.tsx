import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR, DELIVERY_PKR } from "@/lib/money";

export function CartDrawer() {
  const { items, open, setOpen, remove, setQuantity, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: reward } = useQuery({
    queryKey: ["reward", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("discount_code, discount_percent, free_delivery")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const percent = reward?.discount_percent ?? 0;
  const discount = Math.round((subtotal * percent) / 100);
  const delivery = items.length === 0 ? 0 : reward?.free_delivery ? 0 : DELIVERY_PKR;
  const total = subtotal - discount + delivery;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>Prices shown in Pakistani Rupees.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="grid gap-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={72}
                    height={72}
                    loading="lazy"
                    className="h-18 w-18 shrink-0 rounded-md object-cover no-select"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Size {item.size}
                      {item.customMm ? ` (${item.customMm})` : ""} · {item.shape} · {item.finish}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gold-deep">
                      {formatPKR(item.price * item.quantity)}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-touch"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                      >
                        <Minus aria-hidden="true" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon-touch"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                      >
                        <Plus aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-touch"
                        aria-label="Remove item"
                        className="ml-auto"
                        onClick={() => remove(item.key)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-4">
          <dl className="grid gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold">{formatPKR(subtotal)}</dd>
            </div>
            {percent > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Spin discount {percent}%
                  {reward?.discount_code ? ` · ${reward.discount_code}` : ""}
                </dt>
                <dd className="font-semibold text-gold-deep">-{formatPKR(discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-semibold">
                {reward?.free_delivery ? "Free" : formatPKR(delivery)}
              </dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold">{formatPKR(total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            The final total is calculated again on the server before your order is saved.
          </p>
          <Button
            size="touch"
            className="mt-3 w-full"
            disabled={items.length === 0}
            onClick={() => {
              setOpen(false);
              void navigate({ to: user ? "/checkout" : "/auth" });
            }}
          >
            {user ? "Checkout" : "Sign in to checkout"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}