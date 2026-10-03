import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_PRODUCTS } from "@/lib/mock-catalog";
import {
  CATALOG_CHANGED_EVENT,
  getInventory,
  loadCustomProducts,
  saveCustomProduct,
  setInventory,
  type CustomProduct,
} from "@/lib/mock-store";
import { formatPKR } from "@/lib/money";
import { cleanText } from "@/lib/sanitize";
import { SIZES, SHAPES, FINISHES } from "@/lib/shop-types";

export const Route = createFileRoute("/admin/customize")({
  head: () => ({
    meta: [
      { title: "Customize store — Nail by Muskii Admin" },
      { name: "description", content: "Admin product and inventory management." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCustomize,
});

const COLOR_OPTIONS = ["brown", "nude", "mahogany", "glitter", "milky", "gold"];

function AdminCustomize() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) void navigate({ to: "/", replace: true });
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Customize store</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Admin only. Add new sets or manage stock for existing ones. Changes go live immediately.
      </p>
      <AddProductForm />
      <InventoryManager />
    </main>
  );
}

/* ---------- Option A: add a new product ---------- */

function AddProductForm() {
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L"]);
  const [colors, setColors] = useState<string[]>(["brown"]);
  const [shape, setShape] = useState<string>("Almond");
  const [finish, setFinish] = useState<string>("Glossy");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const readFiles = (files: FileList | File[]) => {
    Array.from(files)
      .filter((file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024)
      .slice(0, 6)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setImages((current) => [...current, reader.result as string].slice(0, 6));
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const toggle = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const priceNum = Number(price);
  const stockNum = Number(stock);
  const valid =
    images.length > 0 &&
    cleanText(name, 80).length >= 2 &&
    sizes.length > 0 &&
    colors.length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 100 &&
    priceNum <= 100000 &&
    Number.isInteger(stockNum) &&
    stockNum >= 0 &&
    stockNum <= 9999;

  const submit = () => {
    if (!valid) return;
    const slug = `${cleanText(name, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    const product: CustomProduct = {
      id: slug,
      slug,
      name: cleanText(name, 80),
      description:
        cleanText(description, 300) ||
        "Handmade press-on set. Ten nails plus glue tabs and a mini file.",
      price_pkr: Math.round(priceNum),
      image_url: images[0]!,
      shape,
      finish,
      palette: colors[0]!,
      sizes,
      colors,
      stock: stockNum,
    };
    saveCustomProduct(product);
    setSaved(true);
    setImages([]);
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-bold">Add new product</h2>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          readFiles(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById("admin-image-input")?.click()}
        onKeyDown={(e) => e.key === "Enter" && document.getElementById("admin-image-input")?.click()}
        className={`mt-4 flex min-h-28 cursor-pointer items-center justify-center rounded-md border-2 border-dashed p-4 text-center text-sm ${
          dragOver ? "border-gold-deep bg-secondary" : "border-border text-muted-foreground"
        }`}
      >
        Drag and drop images here, or click to browse (up to 6, max 5 MB each)
      </div>
      <input
        id="admin-image-input"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && readFiles(e.target.files)}
      />
      {images.length > 0 ? (
        <ul className="mt-3 grid grid-cols-6 gap-2">
          {images.map((src, index) => (
            <li key={index}>
              <img src={src} alt={`Upload ${index + 1}`} className="aspect-square w-full rounded object-cover" />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product name</span>
          <Input className="min-h-12" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
          <Input className="min-h-12" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available sizes</p>
          <div className="flex flex-wrap gap-2">
            {SIZES.filter((s) => s !== "XS").map((s) => (
              <button key={s} type="button" onClick={() => toggle(sizes, s, setSizes)}
                className={`min-h-12 rounded-md border px-4 text-sm font-semibold ${sizes.includes(s) ? "border-gold-deep bg-gold text-accent-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available colors</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} type="button" onClick={() => toggle(colors, c, setColors)}
                className={`min-h-12 rounded-md border px-4 text-sm font-semibold capitalize ${colors.includes(c) ? "border-gold-deep bg-gold text-accent-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shape</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((s) => (
                <button key={s} type="button" onClick={() => setShape(s)}
                  className={`min-h-12 rounded-md border px-3 text-sm font-semibold ${shape === s ? "border-gold-deep bg-gold text-accent-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Finish</p>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <button key={f} type="button" onClick={() => setFinish(f)}
                  className={`min-h-12 rounded-md border px-3 text-sm font-semibold ${finish === f ? "border-gold-deep bg-gold text-accent-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Base price (PKR)</span>
            <Input className="min-h-12" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Initial stock quantity</span>
            <Input className="min-h-12" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </label>
        </div>

        <Button size="touch" variant="gold" disabled={!valid} onClick={submit}>
          Add product to store
        </Button>
        {saved ? <p className="text-sm font-semibold text-primary">Product added — it is live on the store page now.</p> : null}
      </div>
    </section>
  );
}

/* ---------- Option B: manage existing products & inventory ---------- */

function InventoryManager() {
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [stock, setStock] = useState("");
  const [oosSizes, setOosSizes] = useState<string[]>([]);
  const [oosColors, setOosColors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setCustomProducts(loadCustomProducts());
    refresh();
    window.addEventListener(CATALOG_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CATALOG_CHANGED_EVENT, refresh);
  }, []);

  const allProducts = useMemo(() => [...customProducts, ...MOCK_PRODUCTS], [customProducts]);
  const selected = allProducts.find((p) => p.id === selectedId) ?? null;

  const pick = (id: string) => {
    setSelectedId(id);
    const entry = getInventory(id);
    setStock(entry.stock === null ? "" : String(entry.stock));
    setOosSizes(entry.oosSizes);
    setOosColors(entry.oosColors);
  };

  const toggle = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const save = () => {
    if (!selected) return;
    const stockNum = stock === "" ? null : Math.max(0, Math.min(9999, Number(stock) || 0));
    setInventory(selected.id, { stock: stockNum, oosSizes, oosColors });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const productColors = selected
    ? "colors" in selected
      ? (selected as CustomProduct).colors
      : [selected.palette]
    : [];

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-bold">Customize existing products & inventory</h2>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select product</span>
        <select
          className="min-h-12 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={selectedId}
          onChange={(e) => pick(e.target.value)}
        >
          <option value="">Choose a product…</option>
          {allProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatPKR(p.price_pkr)}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <div className="mt-5 grid gap-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Exact stock count (hidden from customers)
            </span>
            <Input
              className="min-h-12"
              inputMode="numeric"
              placeholder="Leave empty for unlimited"
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </label>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sizes marked out of stock
            </p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button key={s} type="button" onClick={() => toggle(oosSizes, s, setOosSizes)}
                  className={`min-h-12 rounded-md border px-4 text-sm font-semibold ${oosSizes.includes(s) ? "border-destructive bg-destructive text-destructive-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Colors marked out of stock
            </p>
            <div className="flex flex-wrap gap-2">
              {productColors.map((c) => (
                <button key={c} type="button" onClick={() => toggle(oosColors, c, setOosColors)}
                  className={`min-h-12 rounded-md border px-4 text-sm font-semibold capitalize ${oosColors.includes(c) ? "border-destructive bg-destructive text-destructive-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Button size="touch" variant="gold" onClick={save}>
            Save changes
          </Button>
          {saved ? <p className="text-sm font-semibold text-primary">Saved — the live store listing is updated.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
