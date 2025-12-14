import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. IMPORT IMPORTANT
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/stock.model';
@Component({
  selector: 'app-stock-manager',
  standalone: true,
  // 2. AJOUTER ReactiveFormsModule ICI
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './stock-manager.component.html',
  styleUrls: ['./stock-manager.component.css']
})
export class StockManagerComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder); // Injection du constructeur de formulaire
  private toastService = inject(ToastService);

  products$ = this.supabaseService.products$;
  fournisseurs$ = this.supabaseService.fournisseurs$;
  
  // État pour afficher/masquer le formulaire
  showCreateForm = false;
  activeTab = 'stocks';
  purchases: any[] = [];
  filteredPurchases: any[] = [];
  filterSupplierId: string = '';
  totalExpenses: number = 0;
  totalSales: number = 0;
  totalMargin: number = 0;
  products: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  showPriceModal = false;
  editingProduct: any = null;
  editingPrice: number = 0;

  get totalPages(): number {
    return Math.ceil(this.filteredPurchases.length / this.itemsPerPage);
  }

  get paginatedPurchases() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPurchases.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // 3. DÉFINITION DU FORMULAIRE
  productForm: FormGroup = this.fb.group({
    sku: ['', [Validators.required, Validators.minLength(3)]], // Code unique
    name: ['', Validators.required],
    min_stock_threshold: [10, [Validators.required, Validators.min(0)]], // Seuil alerte
    description: ['']
  });

  ngOnInit() {
    this.supabaseService.loadProducts();
    this.supabaseService.loadFournisseurs();
    this.products$.subscribe(products => {
      this.products = products;
      this.calculateTotal();
    });
    this.loadPurchases();
  }

  async addStock(product: Product) {
    if (!product.id) return;
    await this.supabaseService.updateStock(product.id, 1);
  }

  async removeStock(product: Product) {
    if (!product.id) return;
    
    if (product.current_stock <= 0) {
      this.toastService.error('Opération impossible : Le stock ne peut pas être négatif.');
      return;
    }
    
    try {
      await this.supabaseService.updateStock(product.id, -1);
    } catch (error: any) {
      // Code erreur PostgreSQL 23514 = Violation de contrainte CHECK
      if (error.code === '23514') {
        this.toastService.error('Opération impossible : Le stock ne peut pas être négatif.');
      } else {
        console.error('Erreur lors de la mise à jour du stock:', error);
      }
    }
  }

  // 4. SOUMISSION DU NOUVEAU PRODUIT
  async onSubmitCreate() {
    if (this.productForm.invalid) return;

    try {
      // productForm.value contient { sku: '...', name: '...', ... }
      await this.supabaseService.createProduct(this.productForm.value);
      
      // Réinitialiser et fermer
      this.productForm.reset({ min_stock_threshold: 10 });
      this.showCreateForm = false;
      
    } catch (error: any) {
      if (error.code === '23505') { // Code erreur Postgres pour "Unique Violation"
        this.toastService.error('Ce SKU existe déjà !');
      } else {
        this.toastService.error('Erreur lors de la création du produit.');
      }
    }
  }

  async loadPurchases() {
    this.purchases = await this.supabaseService.getPurchasesHistory() || [];
    this.applyFilter();
  }

  applyFilter() {
    if (!this.filterSupplierId) {
      this.filteredPurchases = this.purchases;
    } else {
      // Comparaison souple (==) car l'ID peut être string ou number selon la source
      this.filteredPurchases = this.purchases.filter(p => p.supplier_id == this.filterSupplierId);
    }
    this.currentPage = 1;
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalExpenses = this.filteredPurchases.reduce((acc, p) => acc + (p.quantity * Number(p.supplier_price)), 0);
    
    this.totalSales = this.filteredPurchases.reduce((acc, p) => {
      const product = this.products.find(prod => prod.id === p.product_id);
      const price = product ? (product.myprice || 0) : 0;
      return acc + (p.quantity * price);
    }, 0);
    this.totalMargin = this.totalSales - this.totalExpenses;
  }

  getTotalStockValue(products: Product[]): number {
    return products.reduce((total, product) => {
      return total + (product.current_stock * (product.price || 0));
    }, 0);
  }

  openPriceModal(product: any, fallbackId?: any) {
    this.editingProduct = { ...product }; // Copie pour éviter les effets de bord
    // Si l'objet produit n'a pas d'ID (cas fréquent dans les jointures), on utilise l'ID de la ligne d'achat
    if (!this.editingProduct.id && fallbackId) {
      this.editingProduct.id = fallbackId;
    }
    this.editingPrice = product.myprice || 0;
    this.showPriceModal = true;
  }

  closePriceModal() {
    this.showPriceModal = false;
    this.editingProduct = null;
    this.editingPrice = 0;
  }

  async savePrice() {
    if (!this.editingProduct || !this.editingProduct.id) {
      this.toastService.error("Erreur: Identifiant du produit introuvable. Impossible de sauvegarder.");
      return;
    }

    try {
      await this.supabaseService.updateProduct(this.editingProduct.id, { myprice: this.editingPrice });
      this.toastService.success('Prix mis à jour');
      this.closePriceModal();
      this.supabaseService.loadProducts();
      this.loadPurchases();
    } catch (error) {
      console.error(error);
      this.toastService.error('Erreur lors de la mise à jour du prix');
    }
  }

  findProduct(products: any[], productId: string): any {
    // Récupère le produit complet depuis la liste principale pour avoir 'myprice' à jour
    return products.find(p => p.id === productId);
  }
}