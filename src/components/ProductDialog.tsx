import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { formatPKR } from "@/lib/money";
import { cleanText } from "@/lib/sanitize";
import { SIZES, SHAPES, FINISHES, type Product } from "@/lib/shop-types";

function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`min-h-12 rounded-md border px-4 text-sm font-semibold ${
              value === option
                ? "border-gold-deep bg-gold text-accent-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductDialog({
  product,
  suggestions,
  onOpenChange,
  onSelectSuggestion,
}: {
  product: Product | null;
  suggestions: Product[];
  onOpenChange: (open: boolean) => void;
  onSelectSuggestion: (product: Product) => void;
}) {
  const { add } = useCart();
  const [size, setSize] = useState<string>("M");
  const [customMm, setCustomMm] = useState("");
  const [shape, setShape] = useState<string>("Almond");
  const [finish, setFinish] = useState<string>("Glossy");

  if (!product) return null;

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>

        <img
          src={product.image_url}
          alt={product.name}
          width={1024}
          height={1024}
          loading="lazy"
          className="aspect-square w-full rounded-lg object-cover no-select"
        />

        <p className="text-lg font-bold text-gold-deep">{formatPKR(product.price_pkr)}</p>

        <div className="grid gap-4">
          <OptionRow label="Size" options={SIZES} value={size} onChange={setSize} />
          {size === "Custom" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Measurements in mm (thumb to pinky)
              </span>
              <Input
                className="min-h-12"
                inputMode="numeric"
                placeholder="e.g. 16, 13, 12, 11, 9"
                value={customMm}
                maxLength={60}
                onChange={(event) => setCustomMm(event.target.value)}
              />
            </label>
          ) : null}
          <OptionRow label="Shape" options={SHAPES} value={shape} onChange={setShape} />
          <OptionRow label="Finish" options={FINISHES} value={finish} onChange={setFinish} />
        </div>

        <Button
          size="touch"
          className="w-full"
          disabled={size === "Custom" && cleanText(customMm, 60).length < 3}
          onClick={() => {
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: product.image_url,
              price: product.price_pkr,
              quantity: 1,
              size,
              customMm: size === "Custom" ? cleanText(customMm, 60) : null,
              shape,
              finish,
            });
            onOpenChange(false);
          }}
        >
          Add to cart
        </Button>

        {suggestions.length > 0 ? (
          <section className="border-t border-border pt-4">
            <h3 className="text-sm font-bold">Suggested styles</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sets that sit in the same colour family as {product.name}.
            </p>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion(suggestion)}
                    className="w-full rounded-md border border-border p-1 text-left hover:border-gold-deep"
                  >
                    <img
                      src={suggestion.image_url}
                      alt={suggestion.name}
                      width={200}
                      height={200}
                      loading="lazy"
                      className="aspect-square w-full rounded object-cover no-select"
                    />
                    <span className="mt-1 block truncate text-[11px] font-semibold">
                      {suggestion.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {formatPKR(suggestion.price_pkr)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}