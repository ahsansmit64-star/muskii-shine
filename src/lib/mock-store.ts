/**
 * Shared store types and the live catalog cache.
 * Custom products and stock status come from the database; this module keeps
 * an in-memory copy so product cards can read them synchronously.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/shop-types";

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
  image_urls: string[];
};

export type InventoryEntry = {
  /** null = not tracked (always in stock). Customers only ever get null/0/1. */
  stock: number | null;
  oosSizes: string[];
  oosColors: string[];
};

export const CATALOG_CHANGED_EVENT = "muskii-catalog-changed";
export const SPIN_COOLDOWN_MS = 15 * 24 * 60 * 60 * 1000;

/* ---------- Spin cooldown helpers ---------- */

export function spinCooldownRemaining(reward: Reward | null): number {
  if (!reward) return 0;
  const elapsed = Date.now() - new Date(reward.spun_at).getTime();
  return Math.max(0, SPIN_COOLDOWN_MS - elapsed);
}

export function formatCountdown(ms: number): string {
  const totalHours = Math.ceil(ms / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days} ${days === 1 ? "day" : "days"}, ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/* ---------- Live catalog cache ---------- */

let customProducts: CustomProduct[] = [];
let inventory: Record<string, InventoryEntry> = {};
let loading: Promise<void> | null = null;

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CATALOG_CHANGED_EVENT));
}

export function refreshCatalog(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  loading = (async () => {
    const [{ data: products }, { data: stock }] = await Promise.all([
      supabase.from("custom_products").select("*").order("created_at", { ascending: false }),
      supabase.rpc("get_stock_status"),
    ]);
    customProducts = (products ?? []).map((p) => ({
      id: p.id,
      slug: p.id,
      name: p.name,
      description: p.description,
      price_pkr: p.price_pkr,
      image_url: p.image_urls[0] ?? "",
      image_urls: p.image_urls,
      shape: p.shape,
      finish: p.finish,
      palette: p.colors[0] ?? "nude",
      sizes: p.sizes,
      colors: p.colors,
    }));
    const next: Record<string, InventoryEntry> = {};
    for (const row of stock ?? []) {
      next[row.product_ref] = {
        stock: row.in_stock ? null : 0,
        oosSizes: row.oos_sizes ?? [],
        oosColors: row.oos_colors ?? [],
      };
    }
    inventory = next;
    emit();
  })().catch(() => undefined);
  return loading;
}

if (typeof window !== "undefined") void refreshCatalog();

export function loadCustomProducts(): CustomProduct[] {
  return customProducts;
}

export function getInventory(productId: string): InventoryEntry {
  return inventory[productId] ?? { stock: null, oosSizes: [], oosColors: [] };
}

/** Customers only ever see in/out of stock — never exact counts. */
export function isProductInStock(productId: string): boolean {
  const entry = getInventory(productId);
  return entry.stock === null || entry.stock > 0;
}
