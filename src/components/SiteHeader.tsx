import { Link } from "@tanstack/react-router";
import { ShoppingBag, LogOut } from "lucide-react";
import { HeaderLogo } from "@/components/brand/HeaderLogo";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" aria-label="Nail by Muskii home">
          <HeaderLogo />
        </Link>

        <nav className="flex items-center gap-1">
          {!loading && user ? (
            <>
              <Link
                to="/orders"
                className="hidden min-h-12 items-center rounded-md px-3 text-sm font-medium hover:bg-secondary sm:inline-flex"
              >
                My orders
              </Link>
              <button
                type="button"
                onClick={() => void supabase.auth.signOut()}
                aria-label="Sign out"
                className="inline-flex h-12 w-12 items-center justify-center rounded-md hover:bg-secondary"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex min-h-12 items-center rounded-md px-3 text-sm font-semibold hover:bg-secondary"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Open cart, ${count} items`}
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-gold px-1.5 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            ) : null}
          </button>
        </nav>
      </div>
    </header>
  );
}