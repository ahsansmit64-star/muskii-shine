export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_pkr: number;
  image_url: string;
  shape: string;
  finish: string;
  palette: string;
};

export const SIZES = ["XS", "S", "M", "L", "Custom"] as const;
export const SHAPES = ["Almond", "Coffin", "Stiletto", "Square", "Oval"] as const;
export const FINISHES = ["Glossy", "Matte"] as const;

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  customMm: string | null;
  shape: string;
  finish: string;
};