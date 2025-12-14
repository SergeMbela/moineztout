export interface Product {
  id: string;
  sku: string;
  name: string;
  current_stock: number;
  min_stock_threshold: number;
  price?: number;
  myprice?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// Pour l'ajout de mouvement
export interface StockMovement {
  product_id: string;
  movement_type: 'IN' | 'OUT';
  quantity: number;
  new_stock_level: number;
  timestamp: string;
  comment?: string;
  id?: string;
  product?: Product
  myprice?: number;

}