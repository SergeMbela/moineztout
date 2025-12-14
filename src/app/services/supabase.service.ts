import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Product, StockMovement } from '../models/stock.model';
import { Fournisseur } from '../models/fournisseur.model';
import { Vente } from '../models/vente.model';
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
}