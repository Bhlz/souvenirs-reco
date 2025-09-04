// lib/types.ts

// Grupo de variantes (por ejemplo: Tamaño, Color)
export type VariantGroup = {
  name: string;
  values: string[];
};

// Producto de tienda
export type Product = {
  slug: string;
  name: string;
  price: number;                 // precio base (fallback si no coincide variante)
  images: string[];

  rating?: number;
  reviews?: number;
  category?: string;
  description?: string;
  stock?: number;

  // Variantes visibles (UI)
  variants?: VariantGroup[];

  /**
   * Mapa opcional de precios por variante.
   * Clave: combinación ordenada "Atributo:Valor|Atributo2:Valor2"
   * Ejemplos:
   *  "Tamaño:Chico": 699
   *  "Tamaño:Mediano|Color:Rojo": 769
   */
  variantPriceMap?: Record<string, number>;

  // SKUs sugeridos para bundle/upsell
  bundleSkus?: string[];
};

// Pedido (si lo necesitas en otros módulos)
export type Order = {
  id: string;
  preferenceId: string;
  items: { slug: string; qty: number; price: number }[];
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_process' | 'unknown';
  paymentId?: string;
  raw?: any;
  shipment?: { status: 'pending' | 'shipped' | 'delivered'; tracking?: string; carrier?: string };
  invoice?: { number?: string; url?: string };
};
