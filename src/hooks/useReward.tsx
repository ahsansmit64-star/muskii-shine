import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Reward, Voucher } from "@/lib/mock-store";

type RewardContextValue = {
  reward: Reward | null;
  vouchers: Voucher[];
  hasSpun: boolean;
  spinOpen: boolean;
  setSpinOpen: (open: boolean) => void;
  setReward: (reward: Reward) => void;
  clearReward: () => void;
  refresh: () => Promise<void>;
};

const RewardContext = createContext<RewardContextValue | null>(null);

export function RewardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reward, setRewardState] = useState<Reward | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [spinOpen, setSpinOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setRewardState(null);
      setVouchers([]);
      setLoaded(false);
      return;
    }
    const [{ data: spin }, { data: vs }] = await Promise.all([
      supabase.from("user_spins").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_vouchers").select("*").eq("user_id", user.id).order("won_at", { ascending: false }),
    ]);
    const list: Voucher[] = (vs ?? []).map((v) => ({
      code: v.code,
      prize_label: v.prize_label,
      discount_percent: v.discount_percent,
      free_delivery: v.free_delivery,
      won_at: v.won_at,
      used: v.used,
    }));
    setVouchers(list);
    const active = list.find((v) => !v.used) ?? null;
    setRewardState(
      spin
        ? {
            prize_label: active?.prize_label ?? spin.prize_label,
            discount_percent: active?.discount_percent ?? 0,
            free_delivery: active?.free_delivery ?? false,
            discount_code: active?.code ?? null,
            spun_at: spin.spun_at,
          }
        : null,
    );
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setReward = useCallback(
    (next: Reward) => {
      setRewardState(next);
      void refresh();
    },
    [refresh],
  );

  const clearReward = useCallback(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<RewardContextValue>(
    () => ({
      reward,
      vouchers,
      hasSpun: loaded && reward !== null,
      spinOpen,
      setSpinOpen,
      setReward,
      clearReward,
      refresh,
    }),
    [reward, vouchers, loaded, spinOpen, setReward, clearReward, refresh],
  );

  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>;
}

export function useReward() {
  const context = useContext(RewardContext);
  if (!context) throw new Error("useReward must be used inside RewardProvider");
  return context;
}
