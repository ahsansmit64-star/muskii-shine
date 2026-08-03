import n1 from "@/assets/nails-1.jpg.asset.json";
import n2 from "@/assets/nails-2.jpg.asset.json";
import n3 from "@/assets/nails-3.jpg.asset.json";
import n4 from "@/assets/nails-4.jpg.asset.json";
import n5 from "@/assets/nails-5.jpg.asset.json";
import n6 from "@/assets/nails-6.jpg.asset.json";
import n7 from "@/assets/nails-7.jpg";
import n8 from "@/assets/nails-8.jpg";
import n9 from "@/assets/nails-9.jpg";
import n10 from "@/assets/nails-10.jpg";
import n11 from "@/assets/nails-11.jpg";
import n12 from "@/assets/nails-12.jpg";
import { SHAPES, type Product } from "@/lib/shop-types";

type Design = {
  base: string;
  palette: string;
  finish: "Glossy" | "Matte";
  tag: string;
  image: string;
};

const DESIGNS: Design[] = [
  { base: "Cocoa Gloss", palette: "brown", finish: "Glossy", tag: "Everyday brown", image: n7 },
  { base: "Nude Gold Leaf", palette: "nude", finish: "Matte", tag: "Gold foil", image: n8 },
  { base: "Mahogany Deep", palette: "mahogany", finish: "Glossy", tag: "Party red", image: n9 },
  { base: "Champagne Glitter", palette: "glitter", finish: "Glossy", tag: "Sparkle", image: n10 },
  { base: "Milky Gold Dot", palette: "milky", finish: "Glossy", tag: "Minimal", image: n11 },
  { base: "Brown Marble", palette: "brown", finish: "Glossy", tag: "Nail art", image: n12 },
  { base: "Warm Nude Classic", palette: "nude", finish: "Glossy", tag: "Bridal", image: n1.url },
  { base: "Toffee Cream", palette: "brown", finish: "Matte", tag: "Soft neutral", image: n2.url },
  { base: "Gold Tip French", palette: "glitter", finish: "Glossy", tag: "French tip", image: n3.url },
  { base: "Mocha Matte", palette: "mahogany", finish: "Matte", tag: "Winter", image: n4.url },
  { base: "Pearl Milk", palette: "milky", finish: "Glossy", tag: "Office", image: n5.url },
  { base: "Bronze Shimmer", palette: "glitter", finish: "Matte", tag: "Evening", image: n6.url },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** 60 mock sets: every design in every shape, priced PKR 1,800 – 4,500. */
export const MOCK_PRODUCTS: Product[] = DESIGNS.flatMap((design, designIndex) =>
  SHAPES.map((shape, shapeIndex) => {
    const step = designIndex * SHAPES.length + shapeIndex;
    const name = `${design.base} — ${shape}`;
    return {
      id: `${slugify(design.base)}-${slugify(shape)}`,
      slug: `${slugify(design.base)}-${slugify(shape)}`,
      name,
      description: `${design.tag} press-on set in a ${shape.toLowerCase()} shape with a ${design.finish.toLowerCase()} finish. Ten nails plus glue tabs and a mini file.`,
      price_pkr: 1800 + step * 45,
      image_url: design.image,
      shape,
      finish: design.finish,
      palette: design.palette,
    } satisfies Product;
  }),
);

export function suggestFor(product: Product, limit = 3): Product[] {
  const sameFamily = MOCK_PRODUCTS.filter(
    (p) => p.id !== product.id && p.palette === product.palette,
  );
  const others = MOCK_PRODUCTS.filter(
    (p) => p.id !== product.id && p.palette !== product.palette && p.finish === product.finish,
  );
  return [...sameFamily, ...others].slice(0, limit);
}
