import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_PRODUCTS } from "@/lib/mock-catalog";
import { refreshCatalog } from "@/lib/mock-store";
import { formatPKR } from "@/lib/money";
import { SIZES } from "@/lib/shop-types";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Panel — Nail by Muskii" },
      { name: "description", content: "Store management for Nail by Muskii." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Panel — Nail by Muskii" },
      { property: "og:description", content: "Store management for Nail by Muskii." },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "add", label: "Add New Product" },
  { id: "inventory", label: "Customize Products & Inventory" },
  { id: "orders", label: "Order History" },
  { id: "customers", label: "Customers" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("add");
  const [checked, setChecked] = useState(false);

  // Wait for the role check to finish before deciding.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/" });
      return;
    }
    const t = window.setTimeout(() => setChecked(true), 1500);
    return () => window.clearTimeout(t);
  }, [loading, user, navigate]);

  useEffect(() => {
    if (checked && !isAdmin) void navigate({ to: "/" });
  }, [checked, isAdmin, navigate]);

  if (!isAdmin) {
    return <main className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Checking access…</main>;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="md:w-60 md:shrink-0">
        <h1 className="mb-3 text-xl font-bold">Admin Panel</h1>
        <nav className="flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-12 rounded-md px-3 text-left text-sm font-medium ${
                tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        {tab === "add" ? <AddProduct /> : null}
        {tab === "inventory" ? <Inventory /> : null}
        {tab === "orders" ? <Orders /> : null}
        {tab === "customers" ? <Customers /> : null}
      </section>
    </main>
  );
}

/* ---------- Tab 1: Add product ---------- */

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function AddProduct() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L"]);
  const [colors, setColors] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    const urls = await Promise.all(list.slice(0, 6 - images.length).map(resizeImage));
    setImages((prev) => [...prev, ...urls].slice(0, 6));
  };

  const save = async () => {
    const p = Number(price);
    if (name.trim().length < 2 || !Number.isInteger(p) || p <= 0 || images.length === 0) {
      toast.error("Add a name, a whole-number price and at least one photo.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("custom_products")
      .insert({
        name: name.trim().slice(0, 100),
        description: description.trim().slice(0, 1000),
        price_pkr: p,
        image_urls: images,
        sizes,
        colors: colors.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 12),
      })
      .select("id")
      .single();
    if (!error && data && stock.trim() !== "") {
      await supabase.from("product_inventory").upsert({ product_ref: data.id, stock: Math.max(0, Number(stock) || 0) });
    }
    setBusy(false);
    if (error) {
      toast.error("Could not save the product.");
      return;
    }
    toast.success("Product added to the store.");
    setName("");
    setDescription("");
    setPrice("");
    setColors("");
    setStock("");
    setImages([]);
    void refreshCatalog();
  };

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-bold">Add new product</h2>
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gold p-4 text-center text-sm text-muted-foreground"
      >
        Drag photos here or click to browse (up to 6, max 5 MB each)
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e: ChangeEvent<HTMLInputElement>) => void onFiles(e.target.files)} />
      </label>
      {images.length ? (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} aria-label="Remove photo">
              <img src={src} alt="" className="h-20 w-20 rounded-md object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <Field label="Product name"><Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Description"><Textarea value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Base price (PKR)"><Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} /></Field>
      <Field label="Sizes">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSizes(sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s])}
              className={`min-h-12 min-w-12 rounded-md border px-3 text-sm ${sizes.includes(s) ? "border-gold bg-secondary font-bold" : "border-border"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Colors (comma separated)"><Input value={colors} maxLength={200} onChange={(e) => setColors(e.target.value)} /></Field>
      <Field label="Initial stock (leave empty for unlimited)"><Input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} /></Field>
      <Button size="touch" onClick={() => void save()} disabled={busy}>{busy ? "Saving…" : "Add product"}</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ---------- Tab 2: Inventory ---------- */

type InvRow = { product_ref: string; stock: number | null; oos_sizes: string[]; oos_colors: string[] };

function Inventory() {
  const [products, setProducts] = useState<{ id: string; name: string; sizes: string[]; colors: string[] }[]>([]);
  const [inv, setInv] = useState<Record<string, InvRow>>({});
  const [selected, setSelected] = useState("");

  const load = useCallback(async () => {
    const [{ data: custom }, { data: rows }] = await Promise.all([
      supabase.from("custom_products").select("id,name,sizes,colors").order("created_at", { ascending: false }),
      supabase.from("product_inventory").select("*"),
    ]);
    setProducts([
      ...(custom ?? []).map((c) => ({ ...c, name: `${c.name} (added)` })),
      ...MOCK_PRODUCTS.map((p) => ({ id: p.id, name: `${p.name} · ${p.shape}`, sizes: ["XS", "S", "M", "L"], colors: [p.palette] })),
    ]);
    setInv(Object.fromEntries((rows ?? []).map((r) => [r.product_ref, r])));
  }, []);
  useEffect(() => void load(), [load]);

  const product = products.find((p) => p.id === selected);
  const row: InvRow = inv[selected] ?? { product_ref: selected, stock: null, oos_sizes: [], oos_colors: [] };

  const save = async (next: InvRow) => {
    setInv({ ...inv, [selected]: next });
    const { error } = await supabase.from("product_inventory").upsert({ ...next, updated_at: new Date().toISOString() });
    if (error) toast.error("Could not save stock.");
    else void refreshCatalog();
  };

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-bold">Customize products & inventory</h2>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="min-h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Choose a product…</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      {product ? (
        <div className="space-y-4 rounded-md border border-border p-4">
          <Field label="Stock count (empty = unlimited)">
            <Input
              inputMode="numeric"
              value={row.stock ?? ""}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setInv({ ...inv, [selected]: { ...row, stock: v === "" ? null : Number(v) } });
              }}
              onBlur={() => void save(row)}
            />
          </Field>
          <Field label="Mark sizes out of stock">
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} type="button" onClick={() => void save({ ...row, oos_sizes: toggle(row.oos_sizes, s) })}
                  className={`min-h-12 min-w-12 rounded-md border px-3 text-sm ${row.oos_sizes.includes(s) ? "border-destructive text-destructive line-through" : "border-border"}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Mark colors out of stock">
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button key={c} type="button" onClick={() => void save({ ...row, oos_colors: toggle(row.oos_colors, c) })}
                  className={`min-h-12 rounded-md border px-3 text-sm ${row.oos_colors.includes(c) ? "border-destructive text-destructive line-through" : "border-border"}`}>
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <p className="text-xs text-muted-foreground">Customers only see “In Stock” or “Out of Stock”.</p>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Tab 3: Orders ---------- */

type OrderRow = {
  id: string; full_name: string; email: string | null; phone: string; street: string; area: string; city: string;
  postal_code: string; total_pkr: number; transaction_id: string; payment_status: string; status: string;
  created_at: string; items: unknown;
};

const PAYMENT_STATUSES = ["Pending Verification", "Verified", "Rejected"];
const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("shop_orders").select("*").order("created_at", { ascending: false });
    setOrders((data ?? []) as OrderRow[]);
  }, []);
  useEffect(() => void load(), [load]);

  const update = async (id: string, patch: Partial<Pick<OrderRow, "payment_status" | "status">>) => {
    const { error } = await supabase.from("shop_orders").update(patch).eq("id", id);
    if (error) toast.error("Could not update the order.");
    else setOrders((o) => o.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Order history</h2>
      {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : null}
      {orders.map((o) => {
        const items = Array.isArray(o.items) ? (o.items as { product_name: string; quantity: number; size: string; shape: string; finish: string }[]) : [];
        return (
          <article key={o.id} className="rounded-md border border-border bg-card p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-bold">#{o.id.slice(0, 8)} · {o.full_name}</p>
              <p className="font-bold">{formatPKR(o.total_pkr)}</p>
            </div>
            <p className="text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.email ?? ""} · {o.phone}</p>
            <p className="text-muted-foreground">{o.street}, {o.area}, {o.city} {o.postal_code}</p>
            <ul className="mt-2 list-disc pl-5">
              {items.map((i, k) => <li key={k}>{i.product_name} × {i.quantity} — {i.size}, {i.shape}, {i.finish}</li>)}
            </ul>
            <p className="mt-2">TRX ID: <span className="font-mono">{o.transaction_id}</span></p>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex items-center gap-2">Payment
                <select value={o.payment_status} onChange={(e) => void update(o.id, { payment_status: e.target.value })} className="min-h-12 rounded-md border border-input bg-background px-2">
                  {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">Delivery
                <select value={o.status} onChange={(e) => void update(o.id, { status: e.target.value })} className="min-h-12 rounded-md border border-input bg-background px-2">
                  {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ---------- Tab 4: Customers ---------- */

type Customer = { id: string; full_name: string | null; username: string | null; email: string | null; signed_in: boolean; last_seen_at: string | null };

function liveStatus(c: Customer) {
  if (!c.signed_in) return "Logged Out";
  const recent = c.last_seen_at && Date.now() - new Date(c.last_seen_at).getTime() < 3 * 60 * 1000;
  return recent ? "Logged In" : "Offline";
}

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<{ user_id: string; id: string; total_pkr: number; status: string; created_at: string }[]>([]);
  const [banned, setBanned] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: p }, { data: o }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,username,email,signed_in,last_seen_at").order("created_at", { ascending: false }),
      supabase.from("shop_orders").select("id,user_id,total_pkr,status,created_at").order("created_at", { ascending: false }),
      supabase.from("customer_bans").select("user_id"),
    ]);
    setCustomers((p ?? []).filter((c) => c.id !== user?.id));
    setOrders(o ?? []);
    setBanned(new Set((b ?? []).map((r) => r.user_id)));
  }, [user?.id]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const toggleBan = async (id: string) => {
    const { error } = banned.has(id)
      ? await supabase.from("customer_bans").delete().eq("user_id", id)
      : await supabase.from("customer_bans").insert({ user_id: id });
    if (error) toast.error("Could not change ban status.");
    else void load();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Customers & accounts</h2>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="p-3">Account name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Live status</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const mine = orders.filter((o) => o.user_id === c.id);
              const isBanned = banned.has(c.id);
              return (
                <>
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3 font-medium">{c.full_name || c.username || "—"}{c.username ? <span className="block text-xs text-muted-foreground">@{c.username}</span> : null}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3">{isBanned ? "Banned" : liveStatus(c)}</td>
                    <td className="p-3">{mine.length}</td>
                    <td className="flex flex-wrap gap-2 p-3">
                      <Button size="touch" variant="outline" onClick={() => setOpen(open === c.id ? null : c.id)} disabled={!mine.length}>
                        Order details
                      </Button>
                      <Button size="touch" variant={isBanned ? "outline" : "destructive"} onClick={() => void toggleBan(c.id)}>
                        {isBanned ? "Unban" : "Ban"}
                      </Button>
                    </td>
                  </tr>
                  {open === c.id ? (
                    <tr key={`${c.id}-d`} className="bg-secondary/50">
                      <td colSpan={5} className="p-3">
                        {mine.map((o) => (
                          <p key={o.id}>#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()} · {formatPKR(o.total_pkr)} · {o.status}</p>
                        ))}
                      </td>
                    </tr>
                  ) : null}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
