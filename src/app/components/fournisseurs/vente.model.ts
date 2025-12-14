export interface Vente {
  id?: number;
  product_id: number; // ou string selon votre ID produit
  quantity: number;
  price_unit?: number;
  total_price: number;
  created_at?: string;
}