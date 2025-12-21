import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. IMPORT IMPORTANT
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/stock.model';
import { environment } from '../../../environments/environment';
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
  uploadingProductId: string | null = null;

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

  async uploadPhoto(event: any, product: any) {
    let file = event.target.files[0];
    if (!file) return;

    // Validation de la taille initiale (Max 10MB avant compression)
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error("L'image est trop volumineuse (Max 10MB)");
      return;
    }

    this.uploadingProductId = product.id;

    try {
      // Compression automatique (Redimensionnement + Qualité 70%)
      file = await this.compressImage(file);

      // Création d'un nom de fichier unique
      const fileExt = 'jpg'; // On force l'extension jpg car la compression sort du JPEG
      // Nettoyage du SKU pour éviter les caractères spéciaux (espaces, /, #) qui causent l'erreur 400
      const safeSku = product.sku.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filePath = `boutique/${safeSku}_${Date.now()}.${fileExt}`;

      const imageUrl = await this.supabaseService.uploadProductImage(file, filePath);

      // Mise à jour du produit (suppose l'existence de la colonne 'image_path')
      await this.supabaseService.updateProduct(product.id, { image_path: imageUrl } as any);
      
      this.toastService.success('Photo téléversée avec succès');
    } catch (error: any) {
      console.error('Erreur upload:', error);
      if (error.message === 'Bucket not found' || (error.error && error.error === 'Bucket not found')) {
        this.toastService.error(`Erreur config: Le bucket '${environment.storageBucket}' n'existe pas dans Supabase.`);
      } else {
        this.toastService.error("Erreur lors de l'envoi de la photo");
      }
    } finally {
      this.uploadingProductId = null;
      event.target.value = ''; // Réinitialise l'input pour permettre de re-sélectionner le même fichier si besoin
    }
  }

  private compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Largeur max en pixels
          
          // Calcul des nouvelles dimensions
          const scaleSize = MAX_WIDTH / img.width;
          const width = (scaleSize < 1) ? MAX_WIDTH : img.width;
          const height = (scaleSize < 1) ? img.height * scaleSize : img.height;

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Conversion en Blob JPEG avec qualité 0.7 (70%)
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else reject(new Error('Erreur lors de la compression'));
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  async deletePhoto(product: any) {
    if (!product.image_path) return;
    
    if (!confirm('Voulez-vous vraiment supprimer cette photo ?')) return;

    try {
      // 1. Supprimer du stockage
      await this.supabaseService.deleteProductImage(product.image_path);

      // 2. Mettre à jour la base de données (supprimer le lien)
      await this.supabaseService.updateProduct(product.id, { image_path: null } as any);
      
      this.toastService.success('Photo supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      this.toastService.error("Erreur lors de la suppression de la photo");
    }
  }

  findProduct(products: any[], productId: string): any {
    // Récupère le produit complet depuis la liste principale pour avoir 'myprice' à jour
    return products.find(p => p.id === productId);
  }
}