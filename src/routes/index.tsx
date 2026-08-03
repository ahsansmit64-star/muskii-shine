import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { RippleBackground } from "@/components/RippleBackground";
import { ProductDialog } from "@/components/ProductDialog";
import { Button } from "@/components/ui/button";
import { MOCK_PRODUCTS, suggestFor } from "@/lib/mock-catalog";
import { formatPKR } from "@/lib/money";
import type { Product } from "@/lib/shop-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nail by Muskii — Press-On Nail Sets in Pakistan" },
      {
        name: "description",
        content:
          "Handmade press-on nail sets by Nail by Muskii. Pick your size, shape and finish. Prices in PKR with delivery across Pakistan.",
      },
      { property: "og:title", content: "Nail by Muskii — Press-On Nail Sets" },
      {
        property: "og:description",
        content: "Custom-sized press-on nails in almond, coffin, stiletto and square shapes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const products = MOCK_PRODUCTS;
  const [selected, setSelected] = useState<Product | null>(null);
  const suggestions = selected ? suggestFor(selected, 3) : [];

  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <RippleBackground />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Nail studio</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold text-secondary sm:text-5xl">
            Press-on nail sets, made to your measurements
          </h1>
          <p className="mt-4 max-w-xl text-base text-secondary/90">
            Choose a design, pick your size, shape and finish. Each set is made by hand and shipped
            across Pakistan.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="touch" variant="gold" asChild>
              <a href="#catalog">Browse sets</a>
            </Button>
            <Button size="touch" variant="outline" asChild>
              <a
                href="https://www.instagram.com/nail_diaries_by_muskiii?igsh=Mnd3MXkzMHNiazZ6"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Instagram aria-hidden="true" />
                See our work
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section id="catalog" className="lazy-section mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Our sets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} designs available. Tap a set to customise it.
        </p>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => setSelected(product)}
                className="group block w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-gold-deep"
              >
                <img
                  src={product.image_url}
                  alt={`${product.name} press-on nail set`}
                  width={1024}
                  height={1024}
                  loading={index < 3 ? "eager" : "lazy"}
                  className="aspect-square w-full rounded-md object-cover no-select"
                />
                <h3 className="mt-3 text-base font-semibold">{product.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.shape} · {product.finish}
                </p>
                <p className="mt-2 text-sm font-bold text-gold-deep">
                  {formatPKR(product.price_pkr)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="lazy-section mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 rounded-lg border border-border bg-card p-6 sm:grid-cols-3">
          {[
            { title: "Sizing", body: "Pick XS to L, or send your own measurements in millimetres." },
            { title: "Shapes", body: "Almond, coffin, stiletto and square, in glossy or matte." },
            { title: "Delivery", body: `Flat ${formatPKR(250)} across Pakistan. Free with a winning spin.` },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="text-sm font-bold text-primary">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ProductDialog
        product={selected}
        suggestions={suggestions}
        onOpenChange={(open) => !open && setSelected(null)}
        onSelectSuggestion={setSelected}
      />
    </main>
  );
}