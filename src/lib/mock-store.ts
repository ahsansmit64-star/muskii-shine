import type { CartItem } from "@/lib/shop-types";

export type Reward = {
  prize_label: string;
  discount_percent: number;
  free_delivery: boolean;
  discount_code: string | null;
};

export type MockOrder = {
  id: string;
  created_at: string;
  status: string;
  city: string;
  subtotal_pkr: number;
  discount_pkr: number;
  delivery_pkr: number;
  total_pkr: number;
  items: {
    product_name: string;
    unit_price_pkr: number;
    quantity: number;
    size: string;
    shape: string;
    finish: string;
  }[];
};

const REWARD_KEY = "muskii-reward-v1";
const ORDERS_KEY = "muskii-orders-v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore full or blocked storage */
  }
}

export function loadReward(): Reward | null {
  return read<Reward | null>(REWARD_KEY, null);
}

export function saveReward(reward: Reward) {
  write(REWARD_KEY, reward);
}

export function loadOrders(): MockOrder[] {
  return read<MockOrder[]>(ORDERS_KEY, []);
}

export function saveOrder(order: MockOrder) {
  write(ORDERS_KEY, [order, ...loadOrders()].slice(0, 30));
}

export function buildOrder(input: {
  city: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  delivery: number;
}): MockOrder {
  return {
    id: Math.random().toString(36).slice(2, 10),
    created_at: new Date().toISOString(),
    status: "pending",
    city: input.city,
    subtotal_pkr: input.subtotal,
    discount_pkr: input.discount,
    delivery_pkr: input.delivery,
    total_pkr: input.subtotal - input.discount + input.delivery,
    items: input.items.map((item) => ({
      product_name: item.name,
      unit_price_pkr: item.price,
      quantity: item.quantity,
      size: item.size,
      shape: item.shape,
      finish: item.finish,
    })),
  };
}
