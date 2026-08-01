import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SLICES = [
  "5% Off",
  "10% Off",
  "15% Off",
  "Free Delivery",
  "20% Off",
  "Better Luck Next Time",
];

type SpinResult = {
  prize_label: string;
  discount_percent: number;
  free_delivery: boolean;
  already_spun: boolean;
};

export function SpinWheel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const checkedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user || checkedFor.current === user.id) return;
    checkedFor.current = user.id;

    // The spin record lives in the database, so refreshing or clearing local
    // storage cannot unlock a second spin.
    void supabase
      .from("user_spins")
      .select("has_spun")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.has_spun) setOpen(true);
      });
  }, [user]);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    const { data, error } = await supabase.rpc("perform_spin");
    const outcome = (Array.isArray(data) ? data[0] : data) as SpinResult | undefined;

    if (error || !outcome) {
      setSpinning(false);
      setResult({
        prize_label: "Spin unavailable right now",
        discount_percent: 0,
        free_delivery: false,
        already_spun: true,
      });
      return;
    }

    const index = Math.max(SLICES.indexOf(outcome.prize_label), 0);
    const sliceAngle = 360 / SLICES.length;
    setAngle(360 * 5 + (360 - index * sliceAngle - sliceAngle / 2));

    window.setTimeout(() => {
      setSpinning(false);
      setResult(outcome);
      void queryClient.invalidateQueries({ queryKey: ["reward"] });
    }, 3200);
  };

  const sliceAngle = 360 / SLICES.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>One lucky spin</DialogTitle>
          <DialogDescription>
            You get a single spin on this account. The result is decided and stored on our server.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto mt-2 h-56 w-56">
          <div
            className="relative h-full w-full rounded-full border-4 border-gold"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 3.1s cubic-bezier(0.15, 0.9, 0.15, 1)" : "none",
            }}
          >
            {SLICES.map((slice, index) => (
              <span
                key={slice}
                className="absolute left-1/2 top-1/2 w-24 -translate-y-1/2 text-center text-[11px] font-bold leading-tight text-primary-foreground"
                style={{
                  transform: `rotate(${index * sliceAngle + sliceAngle / 2}deg) translateX(28px)`,
                  transformOrigin: "left center",
                }}
              >
                {slice}
              </span>
            ))}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(var(--primary) 0deg ${sliceAngle}deg, var(--gold-deep) ${sliceAngle}deg ${sliceAngle * 2}deg, var(--primary) ${sliceAngle * 2}deg ${sliceAngle * 3}deg, var(--gold-deep) ${sliceAngle * 3}deg ${sliceAngle * 4}deg, var(--primary) ${sliceAngle * 4}deg ${sliceAngle * 5}deg, var(--gold-deep) ${sliceAngle * 5}deg 360deg)`,
                zIndex: -1,
              }}
            />
          </div>
        </div>

        {result ? (
          <div className="mt-3 rounded-md border border-gold bg-secondary p-3 text-center">
            <p className="text-sm font-bold text-primary">{result.prize_label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.discount_percent > 0 || result.free_delivery
                ? "Saved to your account. It applies automatically at checkout."
                : "No reward this time. Your spin has been used."}
            </p>
            <Button size="touch" className="mt-3 w-full" onClick={() => setOpen(false)}>
              Start shopping
            </Button>
          </div>
        ) : (
          <Button size="touch" variant="gold" className="mt-3 w-full" onClick={() => void spin()} disabled={spinning}>
            {spinning ? "Spinning…" : "Spin the wheel"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}