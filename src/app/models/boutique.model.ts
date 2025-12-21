export interface BoutiqueItem {
  id?: string;
  created_at?: string;
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  video_url?: string;
  brand?: string;
  category?: string;
  gender?: string;
  olfactory_family?: string;
  volume_ml?: number;
  product_id?: string; // Lien vers le stock
  is_active?: boolean;
  is_featured?: boolean;
}