export type Product = {
  slug: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  reviews: number;
  category: string;
  description: string;
  stock: number;
  variants?: { name: string; values: string[] }[];
  bundleSkus?: string[];
};

export type Billing = {
  name?: string;
  email?: string;
  rfc?: string;
};
