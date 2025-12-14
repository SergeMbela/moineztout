import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-achat-fournisseurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './achat-fournisseurs.component.html'
  ,
  styleUrls: ['./achat-fournisseurs.component.css']
})
export class AchatFournisseursComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  products$ = this.supabase.products$;
  fournisseurs$ = this.supabase.fournisseurs$;
  purchases: any[] = [];
  filteredPurchases: any[] = [];
  filterSupplierId: string = '';
  totalExpenses: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;

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

  purchaseForm: FormGroup = this.fb.group({
    product_id: ['', Validators.required],
    supplier_id: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    supplier_price: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.supabase.loadProducts();
    this.supabase.loadFournisseurs();
    this.loadPurchases();
  }

  async loadPurchases() {
    try {
      this.purchases = await this.supabase.getPurchasesHistory() || [];
      this.applyFilter();
    } catch (error) {
      console.error('Erreur chargement historique achats', error);
    }
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
  }

  async onSubmitPurchase() {
    if (this.purchaseForm.invalid) return;

    const { product_id, quantity, supplier_price, supplier_id } = this.purchaseForm.value;

    try {
      await this.supabase.addPurchase(product_id, quantity, supplier_price, supplier_id);
      this.toast.success('Approvisionnement enregistré avec succès !');
      this.purchaseForm.reset({ quantity: 1, supplier_price: 0, product_id: '', supplier_id: '' });
      this.loadPurchases(); // Rafraîchir la liste
    } catch (error) {
      this.toast.error("Erreur lors de l'enregistrement.");
      console.error(error);
    }
  }
}
