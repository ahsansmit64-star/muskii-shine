import type { CartItem, Product } from "@/lib/shop-types";

export type Reward = {
  prize_label: string;
  discount_percent: number;
  free_delivery: boolean;
  discount_code: string | null;
  spun_at: string;
};

export type Voucher = {
  code: string;
  prize_label: string;
  discount_percent: number;
  free_delivery: boolean;
  won_at: string;
  used: boolean;
};

export type CustomProduct = Product & {
  sizes: string[];
  colors: string[];
  stock: number;
};

export type InventoryEntry = {
  /** null = not tracked (always in stock) */
  stock: number | null;
  oosSizes: string[];
  oosColors: string[];
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
  payment_method: "Easypaisa / JazzCash";
  payment_status: "Pending Verification";
  transaction_id: string;
  voucher_code: string | null;
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
const VOUCHERS_KEY = "muskii-vouchers-v1";
const ADMIN_KEY = "muskii-admin-v1";
const CUSTOM_PRODUCTS_KEY = "muskii-custom-products-v1";
const INVENTORY_KEY = "muskii-inventory-v1";

export const CATALOG_CHANGED_EVENT = "muskii-catalog-changed";
export const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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

/* ---------- Spin reward (24h cooldown) ---------- */

export function loadReward(): Reward | null {
  const reward = read<Reward | null>(REWARD_KEY, null);
  if (reward && !reward.spun_at) reward.spun_at = new Date().toISOString();
  return reward;
}

export function saveReward(reward: Reward) {
  write(REWARD_KEY, reward);
}

/** Milliseconds until the next free spin; 0 means the user may spin now. */
export function spinCooldownRemaining(reward: Reward | null): number {
  if (!reward) return 0;
  const elapsed = Date.now() - new Date(reward.spun_at).getTime();
  return Math.max(0, SPIN_COOLDOWN_MS - elapsed);
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/* ---------- Vouchers ---------- */

export function loadVouchers(): Voucher[] {
  return read<Voucher[]>(VOUCHERS_KEY, []);
}

export function addVoucher(reward: Reward) {
  if (!reward.discount_code) return;
  const vouchers = loadVouchers();
  if (vouchers.some((v) => v.code === reward.discount_code && !v.used)) return;
  vouchers.unshift({
    code: reward.discount_code,
    prize_label: reward.prize_label,
    discount_percent: reward.discount_percent,
    free_delivery: reward.free_delivery,
    won_at: reward.spun_at,
    used: false,
  });
  write(VOUCHERS_KEY, vouchers.slice(0, 30));
}

export function markVoucherUsed(code: string) {
  write(
    VOUCHERS_KEY,
    loadVouchers().map((v) => (v.code === code ? { ...v, used: true } : v)),
  );
}

/* ---------- Admin flag (demo review toggle) ---------- */

export function isAdmin(): boolean {
  return read<boolean>(ADMIN_KEY, true);
}

export function setAdmin(value: boolean) {
  write(ADMIN_KEY, value);
}

/* ---------- Custom products & inventory ---------- */

export function loadCustomProducts(): CustomProduct[] {
  return read<CustomProduct[]>(CUSTOM_PRODUCTS_KEY, []);
}

export function saveCustomProduct(product: CustomProduct) {
  write(CUSTOM_PRODUCTS_KEY, [product, ...loadCustomProducts()]);
  setInventory(product.id, { stock: product.stock, oosSizes: [], oosColors: [] });
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CATALOG_CHANGED_EVENT));
}

export function loadInventory(): Record<string, InventoryEntry> {
  return read<Record<string, InventoryEntry>>(INVENTORY_KEY, {});
}

export function getInventory(productId: string): InventoryEntry {
  return loadInventory()[productId] ?? { stock: null, oosSizes: [], oosColors: [] };
}

export function setInventory(productId: string, entry: InventoryEntry) {
  const all = loadInventory();
  all[productId] = entry;
  write(INVENTORY_KEY, all);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CATALOG_CHANGED_EVENT));
}

/** Customers only ever see in/out of stock — never exact counts. */
export function isProductInStock(productId: string): boolean {
  const entry = getInventory(productId);
  return entry.stock === null || entry.stock > 0;
}

/* ---------- Orders ---------- */

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
  transactionId: string;
  voucherCode: string | null;
}): MockOrder {
  return {
    id: Math.random().toString(36).slice(2, 10),
    created_at: new Date().toISOString(),
    status: "Pending Verification",
    city: input.city,
    subtotal_pkr: input.subtotal,
    discount_pkr: input.discount,
    delivery_pkr: input.delivery,
    total_pkr: input.subtotal - input.discount + input.delivery,
    payment_method: "Easypaisa / JazzCash",
    payment_status: "Pending Verification",
    transaction_id: input.transactionId,
    voucher_code: input.voucherCode,
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
