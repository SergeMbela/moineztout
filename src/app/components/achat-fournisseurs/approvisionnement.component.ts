import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-approvisionnement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">Approvisionnement Fournisseur</h2>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <form [formGroup]="purchaseForm" (ngSubmit)="onSubmitPurchase()">
          
          <!-- Sélection du produit -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Produit</label>
            <select formControlName="product_id" class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" disabled>Sélectionner un produit</option>
              <option *ngFor="let product of products$ | async" [value]="product.id">
                {{ product.name }} (Stock actuel: {{ product.current_stock }})
              </option>
            </select>
            <div *ngIf="purchaseForm.get('product_id')?.touched && purchaseForm.get('product_id')?.invalid" class="text-red-500 text-xs mt-1">
              Veuillez sélectionner un produit.
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <!-- Quantité -->
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Quantité à ajouter</label>
              <input type="number" formControlName="quantity" min="1" class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Prix Achat -->
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Prix d'achat unitaire (€)</label>
              <input type="number" formControlName="supplier_price" min="0" step="0.01" class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <button type="submit" 
                  [disabled]="purchaseForm.invalid"
                  class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Enregistrer l'entrée de stock
          </button>
        </form>
      </div>
    </div>
  `
})
export class ApprovisionnementComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  products$ = this.supabase.products$;

  purchaseForm: FormGroup = this.fb.group({
    product_id: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    supplier_price: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.supabase.loadProducts();
  }

  async onSubmitPurchase() {
    if (this.purchaseForm.invalid) return;

    const { product_id, quantity, supplier_price } = this.purchaseForm.value;

    try {
      await this.supabase.addPurchase(product_id, quantity, supplier_price);
      this.toast.success('Approvisionnement enregistré avec succès !');
      this.purchaseForm.reset({ quantity: 1, supplier_price: 0, product_id: '' });
    } catch (error) {
      this.toast.error("Erreur lors de l'enregistrement.");
      console.error(error);
    }
  }
}