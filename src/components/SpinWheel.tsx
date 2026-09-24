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

const SLICE_ANGLE = 360 / SLICES.length;

function normaliseAngle(value: number) {
  return ((value % 360) + 360) % 360;
}

function prizeAtPointer(rotation: number) {
  const wheelAngleAtPointer = normaliseAngle(-rotation);
  return Math.floor(wheelAngleAtPointer / SLICE_ANGLE) % SLICES.length;
}

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

  const spin = () => {
    if (spinning || result) return;
    setSpinning(true);
    const selectedIndex = Math.floor(Math.random() * SLICES.length);
    const selectedCenter = selectedIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    const targetAngle = angle + 360 * 5 + normaliseAngle(-selectedCenter - angle);
    setAngle(targetAngle);

    window.setTimeout(() => {
      const winningIndex = prizeAtPointer(targetAngle);
      const outcome = SLICES[winningIndex];
      if (!outcome) return;
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

        <div className="relative mx-auto mt-4 h-64 w-64 max-w-full">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[-10px] z-20 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[24px] border-x-transparent border-t-gold-deep drop-shadow-sm"
          />
          <div
            className="relative h-full w-full overflow-hidden rounded-full border-4 border-gold shadow-lg"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 3.1s cubic-bezier(0.15, 0.9, 0.15, 1)" : "none",
              background: `conic-gradient(var(--primary) 0deg ${SLICE_ANGLE}deg, var(--gold-deep) ${SLICE_ANGLE}deg ${SLICE_ANGLE * 2}deg, var(--primary) ${SLICE_ANGLE * 2}deg ${SLICE_ANGLE * 3}deg, var(--gold-deep) ${SLICE_ANGLE * 3}deg ${SLICE_ANGLE * 4}deg, var(--primary) ${SLICE_ANGLE * 4}deg ${SLICE_ANGLE * 5}deg, var(--gold-deep) ${SLICE_ANGLE * 5}deg 360deg)`,
            }}
          >
            {SLICES.map((slice, index) => {
              const centerRadians = ((index * SLICE_ANGLE + SLICE_ANGLE / 2) * Math.PI) / 180;
              return (
                <span
                  key={slice.prize_label}
                  className="absolute z-10 flex w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center text-[10px] font-extrabold leading-[1.2] text-primary-foreground"
                  style={{
                    left: `${50 + Math.sin(centerRadians) * 30}%`,
                    top: `${50 - Math.cos(centerRadians) * 30}%`,
                  }}
                >
                  {slice.prize_label}
                </span>
              );
            })}
            <span className="absolute left-1/2 top-1/2 z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-gold bg-card" />
          </div>
        </div>

        {result ? (
          <div className="mt-3 rounded-md border border-gold bg-secondary p-3 text-center">
            <p className="text-sm font-bold text-primary">
              Congratulations! You won {result.prize_label}!
            </p>
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
