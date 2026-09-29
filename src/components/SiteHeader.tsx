import { Link } from "@tanstack/react-router";
import { Dices, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { HeaderLogo } from "@/components/brand/HeaderLogo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useReward } from "@/hooks/useReward";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { setSpinOpen } = useReward();
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" aria-label="Nail by Muskii home">
          <HeaderLogo />
        </Link>

        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSpinOpen(true)}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-md px-3 text-sm font-medium hover:bg-secondary"
          >
            <Dices className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Lucky Spin</span>
          </button>

          {isAdmin ? (
            <Link
              to="/admin/customize"
              className="inline-flex min-h-12 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-gold-deep hover:bg-secondary"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Customize</span>
            </Link>
          ) : null}

          <Link
            to="/orders"
            className="hidden min-h-12 items-center rounded-md px-3 text-sm font-medium hover:bg-secondary sm:inline-flex"
          >
            My orders
          </Link>

          <Button
            size="icon-touch"
            onClick={() => setOpen(true)}
            aria-label={`Open cart, ${count} items`}
            className="relative"
          >
            <ShoppingBag aria-hidden="true" />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-gold px-1.5 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            ) : null}
          </Button>
        </nav>
      </div>
    </header>
  );
}
