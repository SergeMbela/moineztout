import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Product, StockMovement } from '../models/stock.model';
import { Fournisseur } from '../models/fournisseur.model';
import { Vente } from '../models/vente.model';
import { BoutiqueItem } from '../models/boutique.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Gestion de l'état local pour l'affichage réactif
  private _products = new BehaviorSubject<Product[]>([]);
  public products$ = this._products.asObservable();

  private _fournisseurs = new BehaviorSubject<Fournisseur[]>([]);
  public fournisseurs$ = this._fournisseurs.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    const isBrowser = isPlatformBrowser(this.platformId);

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser
      }
    });

    if (isBrowser) {
      this.initRealtimeSubscription();
    }
  }

  // 1. Charger les produits initiaux
  async loadProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) console.error('Erreur chargement', error);
    else this._products.next(data || []);
  }

  // 2. Écouter les changements en direct (La partie magique)
  private initRealtimeSubscription() {
    this.supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          this.updateLocalProductState(payload.new as Product);
        } else if (payload.eventType === 'INSERT') {
          this.addProductToLocalState(payload.new as Product);
        } else if (payload.eventType === 'DELETE') {
          this.removeProductFromLocalState(payload.old['id']);
        }
      })
      .subscribe();
  }

  // Helper pour mettre à jour le tableau local sans recharger l'API
  private updateLocalProductState(updatedProduct: Product) {
    const currentProducts = this._products.value;
    const index = currentProducts.findIndex(p => p.id === updatedProduct.id);

    if (index !== -1) {
      const newProducts = [...currentProducts];
      newProducts[index] = updatedProduct; // Mise à jour de la ligne spécifique
      this._products.next(newProducts);
    }
  }

  // Helper pour ajouter un nouveau produit reçu en temps réel
  private addProductToLocalState(newProduct: Product) {
    const currentProducts = this._products.value;
    this._products.next([...currentProducts, newProduct]);
  }

  // Helper pour retirer un produit supprimé
  private removeProductFromLocalState(productId: any) {
    const currentProducts = this._products.value;
    this._products.next(currentProducts.filter(p => p.id !== productId));
  }

  // 3. Créer un produit
  async createProduct(productData: Partial<Product>) {
    const { error } = await this.supabase
      .from('products')
      .insert(productData);

    if (error) {
      console.error('Erreur création', error);
      throw error;
    }
  }

  // Mettre à jour un produit (ex: prix, nom)
  async updateProduct(id: string, updates: Partial<Product>) {
    const { error } = await this.supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Méthode pour mettre à jour le stock
  async updateStock(productId: string, change: number) {
    // 1. Récupérer le stock actuel
    const { data: product, error: fetchError } = await this.supabase
      .from('products')
      .select('current_stock')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const newStock = (product.current_stock || 0) + change;

    // 3. Enregistrer le mouvement
    const { error } = await this.supabase.from('movements').insert({
      product_id: productId,
      quantity: Math.abs(change), // Le SQL impose une quantité positive
      movement_type: change > 0 ? 'IN' : 'OUT',
      new_stock_level: newStock // Nécessaire pour le graphique
    });

    if (error) throw error;
  }

  async getStockHistory(productId: string) {
    const { data, error } = await this.supabase
      .from('movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as (StockMovement & { created_at: string })[];
  }

  // --- GESTION DES FOURNISSEURS ---

  async loadFournisseurs() {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) console.error('Erreur chargement fournisseurs', error);
    else this._fournisseurs.next(data || []);
  }

  async addFournisseur(fournisseur: Partial<Fournisseur>) {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert(fournisseur)
      .select()
      .single();

    if (error) throw error;
    this._fournisseurs.next([...this._fournisseurs.value, data]);
  }

  async deleteFournisseur(id: string) {
    const { error } = await this.supabase.from('suppliers').delete().eq('id', id);
    
    if (error) throw error;
    this._fournisseurs.next(this._fournisseurs.value.filter(f => (f.id as any) !== id));
  }

  // --- GESTION DES ACHATS (APPROVISIONNEMENT) ---

  async addPurchase(productId: string, quantity: number, price: number, supplierId: string) {
    const { error } = await this.supabase
      .from('supplier_purchases')
      .insert({
        product_id: productId,
        quantity: quantity,
        supplier_price: price,
        supplier_id: supplierId
      });

    if (error) throw error;
  }

  async getPurchasesHistory() {
    const { data, error } = await this.supabase
      .from('supplier_purchases')
      .select('*, products(name, sku), suppliers(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // --- GESTION DES VENTES ---

  async createVente(vente: Partial<Vente>) {
    // L'insertion déclenchera automatiquement la mise à jour du stock via le Trigger SQL
    const { error } = await this.supabase
      .from('ventes')
      .insert(vente);

    if (error) throw error;
  }

  // --- ANALYSE CA ---

  async getVentesHistory() {
    const { data, error } = await this.supabase
      .from('ventes')
      .select('*, products(name, sku)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // --- GESTION BOUTIQUE ---

  async getBoutiqueItems(onlyActive: boolean = true) {
    let query = this.supabase
      .from('boutique_items')
      .select('*, products(current_stock)') // On récupère aussi le stock lié
      .order('created_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createBoutiqueItem(item: Partial<BoutiqueItem>) {
    const { error } = await this.supabase
      .from('boutique_items')
      .insert(item);
    if (error) throw error;
  }

  async updateBoutiqueItem(id: string, item: Partial<BoutiqueItem>) {
    const { error } = await this.supabase
      .from('boutique_items')
      .update(item)
      .eq('id', id);
    if (error) throw error;
  }

  async deleteBoutiqueItem(id: string, imageUrl?: string | null) {
    // D'abord, supprimer l'image du stockage si une URL est fournie
    if (imageUrl) {
      await this.deleteProductImage(imageUrl);
    }

    // Ensuite, supprimer l'enregistrement de la base de données
    const { error } = await this.supabase
      .from('boutique_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression article boutique', error);
      throw error;
    }
  }

  // --- AUTH & SESSION ---

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // --- STOCKAGE (IMAGES) ---

  async uploadProductImage(file: File, path: string, onProgress?: (percent: number) => void): Promise<string> {
    // Si un callback de progression est fourni, on utilise XMLHttpRequest pour le suivi
    if (onProgress) {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${environment.supabaseUrl}/storage/v1/object/${environment.storageBucket}/${path}`;
        
        xhr.open('POST', url);
        
        this.supabase.auth.getSession().then(({ data: { session } }) => {
          const token = session?.access_token || environment.supabaseKey;
          
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.setRequestHeader('apikey', environment.supabaseKey);
          xhr.setRequestHeader('x-upsert', 'true');
          if (file.type) xhr.setRequestHeader('Content-Type', file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(null);
            } else {
              // Tentative de récupération du message d'erreur détaillé de Supabase
              let errorMessage = xhr.statusText || `Upload failed (Status ${xhr.status})`;
              try {
                if (xhr.responseText) {
                  const res = JSON.parse(xhr.responseText);
                  if (res.message) errorMessage = res.message;
                  else if (res.error) errorMessage = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
                }
              } catch (e) {
                // Si ce n'est pas du JSON valide, on garde le message par défaut
              }

              const err = new Error(errorMessage);
              (err as any).statusCode = xhr.status;
              reject(err);
            }
          };

          xhr.onerror = () => {
            const err = new Error('Network error');
            (err as any).statusCode = 0;
            reject(err);
          };
          xhr.send(file);
        });
      });
    } else {
      // Sinon, méthode standard SDK (utilisée par StockManager par exemple)
      const { error } = await this.supabase.storage
        .from(environment.storageBucket)
        .upload(path, file, { upsert: true });

      if (error) {
        console.error('Erreur upload storage (Supabase):', error);
        throw error;
      }
    }

    const { data } = this.supabase.storage
      .from(environment.storageBucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async deleteProductImage(url: string) {
    // Extraction du nom de fichier depuis l'URL publique
    const path = url.split(`/${environment.storageBucket}/`).pop();
    
    if (path) {
      // Nettoyage (query params) et décodage pour gérer les espaces/accents
      const cleanPath = decodeURIComponent(path.split('?')[0]);

      // 1. Vérification préalable pour éviter l'erreur 404 "Object not found" dans la console
      // On sépare le dossier du nom de fichier si nécessaire
      const lastSlashIndex = cleanPath.lastIndexOf('/');
      const folder = lastSlashIndex > -1 ? cleanPath.substring(0, lastSlashIndex) : '';
      const fileName = lastSlashIndex > -1 ? cleanPath.substring(lastSlashIndex + 1) : cleanPath;

      const { data: existingFiles } = await this.supabase.storage
        .from(environment.storageBucket)
        .list(folder, { search: fileName });

      // Si le fichier n'est pas trouvé, on considère qu'il est déjà supprimé
      if (!existingFiles || !existingFiles.some(f => f.name === fileName)) {
        return;
      }

      const { error } = await this.supabase.storage
        .from(environment.storageBucket)
        .remove([cleanPath]);
      
      if (error) {
        console.error('Erreur suppression image storage', error);
      }
    }
  }
}