export interface Vente {
  id?: number;
  product_id: string; // CORRECTION : string pour correspondre au UUID
  quantity: number;
  price_unit?: number;
  total_price: number;
  created_at?: string;
}
