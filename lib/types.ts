export type Product = {
  slug: string;
  name: string;
  price: number;                // precio base
  images: string[];
  rating?: number;
  reviews?: number;
  category?: string;
  description?: string;
  stock?: number;

  // Variantes visuales
  variants?: { name: string; values: string[] }[];

  // Precios por variante (opcional)
  // clave: "Tamaño:Chico|Color:Rojo"
  variantPriceMap?: Record<string, number>;
};


export type Billing = {
  name?: string;
  email?: string;
  rfc?: string;
};
