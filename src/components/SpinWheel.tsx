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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  formatCountdown,
  spinCooldownRemaining,
  type Reward,
} from "@/lib/mock-store";

const SLICES: Omit<Reward, "spun_at">[] = [
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
  const { reward, setReward, spinOpen, setSpinOpen, refresh } = useReward();
  const { isLoggedIn } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const [remaining, setRemaining] = useState(0);

  // Auto-open once on first visit when the user has never spun.
  useEffect(() => {
    if (isLoggedIn && !reward && !spinOpen && !sessionStorage.getItem("muskii-spin-shown")) {
      sessionStorage.setItem("muskii-spin-shown", "1");
      setSpinOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Keep the cooldown countdown ticking while the dialog is open.
  useEffect(() => {
    if (!spinOpen) return;
    const tick = () => setRemaining(spinCooldownRemaining(reward));
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, [spinOpen, reward]);

  const coolingDown = remaining > 0;
  const activeReward = reward && (reward.discount_percent > 0 || reward.free_delivery) ? reward : null;

  const spin = async () => {
    if (spinning || coolingDown) return;
    setSpinning(true);
    setResult(null);
    const { data, error } = await supabase.rpc("spin_wheel");
    const row = data?.[0];
    if (error || !row) {
      setSpinning(false);
      toast.error(error?.message === "Account banned" ? "Your account is banned." : "Could not spin right now.");
      return;
    }
    if (row.cooling_down) {
      setSpinning(false);
      await refresh();
      return;
    }
    const selectedIndex = Math.max(0, SLICES.findIndex((s) => s.prize_label === row.prize_label));
    const selectedCenter = selectedIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    const targetAngle = angle + 360 * 5 + normaliseAngle(-selectedCenter - angle);
    setAngle(targetAngle);

    window.setTimeout(() => {
      const won: Reward = {
        prize_label: row.prize_label,
        discount_percent: row.discount_percent,
        free_delivery: row.free_delivery,
        discount_code: row.discount_code,
        spun_at: row.spun_at,
      };
      setSpinning(false);
      setResult(won);
      setReward(won);
      setRemaining(spinCooldownRemaining(won));
    }, 3200);
  };

  return (
    <Dialog open={spinOpen} onOpenChange={setSpinOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Lucky spin</DialogTitle>
          <DialogDescription>
            One free spin every 15 days. Whatever you win applies to your cart automatically.
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
                ? `Code ${result.discount_code} is saved in My Vouchers and applies at checkout.`
                : "No reward this time. Try again when your next spin unlocks."}
            </p>
            <Button size="touch" className="mt-3 w-full" onClick={() => setSpinOpen(false)}>
              Start shopping
            </Button>
          </div>
        ) : coolingDown ? (
          <div className="mt-3 rounded-md border border-border bg-secondary p-3 text-center">
            <p className="text-sm font-bold text-primary">
              Next free spin in: {formatCountdown(remaining)}
            </p>
            {activeReward ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Your active reward: {activeReward.prize_label}
                {activeReward.discount_code ? ` (code ${activeReward.discount_code})` : ""}.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Your last spin won no reward. The wheel unlocks again when the timer ends.
              </p>
            )}
            <Button size="touch" variant="outline" className="mt-3 w-full" onClick={() => setSpinOpen(false)}>
              Close
            </Button>
          </div>
        ) : !isLoggedIn ? (
          <Button asChild size="touch" variant="gold" className="mt-3 w-full">
            <Link to="/auth" onClick={() => setSpinOpen(false)}>
              Sign in to spin
            </Link>
          </Button>
        ) : (
          <Button
            size="touch"
            variant="gold"
            className="mt-3 w-full"
            onClick={() => void spin()}
            disabled={spinning}
          >
            {spinning ? "Spinning…" : "Spin the wheel"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
