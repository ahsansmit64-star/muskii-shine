import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReward } from "@/hooks/useReward";
import { loadReward, type Reward } from "@/lib/mock-store";

const SLICES: Reward[] = [
  { prize_label: "5% Off", discount_percent: 5, free_delivery: false, discount_code: "MUSKII5" },
  { prize_label: "10% Off", discount_percent: 10, free_delivery: false, discount_code: "MUSKII10" },
  { prize_label: "15% Off", discount_percent: 15, free_delivery: false, discount_code: "MUSKII15" },
  {
    prize_label: "Free Delivery",
    discount_percent: 0,
    free_delivery: true,
    discount_code: "MUSKIISHIP",
  },
  { prize_label: "20% Off", discount_percent: 20, free_delivery: false, discount_code: "MUSKII20" },
  {
    prize_label: "Better Luck Next Time",
    discount_percent: 0,
    free_delivery: false,
    discount_code: null,
  },
];

export function SpinWheel() {
  const { setReward } = useReward();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);

  useEffect(() => {
    // Presentation build: the spin result is kept in local storage only.
    const existing = loadReward();
    if (existing) {
      setResult(existing);
      return;
    }
    setOpen(true);
  }, []);

  const sliceAngle = 360 / SLICES.length;

  const spin = () => {
    if (spinning || result) return;
    setSpinning(true);
    const index = Math.floor(Math.random() * SLICES.length);
    const outcome = SLICES[index]!;
    setAngle((current) => current + 360 * 5 + (360 - index * sliceAngle - sliceAngle / 2));

    window.setTimeout(() => {
      setSpinning(false);
      setResult(outcome);
      setReward(outcome);
    }, 3200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>One lucky spin</DialogTitle>
          <DialogDescription>
            You get a single spin. Whatever you win applies to your cart automatically.
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
                key={slice.prize_label}
                className="absolute left-1/2 top-1/2 w-24 -translate-y-1/2 text-center text-[11px] font-bold leading-tight text-primary-foreground"
                style={{
                  transform: `rotate(${index * sliceAngle + sliceAngle / 2}deg) translateX(28px)`,
                  transformOrigin: "left center",
                }}
              >
                {slice.prize_label}
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
                ? `Code ${result.discount_code} applies automatically at checkout.`
                : "No reward this time. Your spin has been used."}
            </p>
            <Button size="touch" className="mt-3 w-full" onClick={() => setOpen(false)}>
              Start shopping
            </Button>
          </div>
        ) : (
          <Button
            size="touch"
            variant="gold"
            className="mt-3 w-full"
            onClick={spin}
            disabled={spinning}
          >
            {spinning ? "Spinning…" : "Spin the wheel"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
