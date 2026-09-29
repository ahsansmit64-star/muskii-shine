import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addVoucher, loadReward, saveReward, type Reward } from "@/lib/mock-store";

type RewardContextValue = {
  reward: Reward | null;
  hasSpun: boolean;
  spinOpen: boolean;
  setSpinOpen: (open: boolean) => void;
  setReward: (reward: Reward) => void;
  clearReward: () => void;
};

const RewardContext = createContext<RewardContextValue | null>(null);

export function RewardProvider({ children }: { children: ReactNode }) {
  const [reward, setRewardState] = useState<Reward | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [spinOpen, setSpinOpen] = useState(false);

  useEffect(() => {
    setRewardState(loadReward());
    setHydrated(true);
  }, []);

  const setReward = useCallback((next: Reward) => {
    setRewardState(next);
    saveReward(next);
    addVoucher(next);
  }, []);

  const clearReward = useCallback(() => {
    const cleared: Reward = {
      prize_label: reward?.prize_label ?? "Spin used",
      discount_percent: 0,
      free_delivery: false,
      discount_code: null,
      spun_at: reward?.spun_at ?? new Date().toISOString(),
    };
    setRewardState(cleared);
    saveReward(cleared);
  }, [reward]);

  const value = useMemo<RewardContextValue>(
    () => ({
      reward,
      hasSpun: hydrated && reward !== null,
      spinOpen,
      setSpinOpen,
      setReward,
      clearReward,
    }),
    [reward, hydrated, spinOpen, setReward, clearReward],
  );

  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>;
}

export function useReward() {
  const context = useContext(RewardContext);
  if (!context) throw new Error("useReward must be used inside RewardProvider");
  return context;
}
