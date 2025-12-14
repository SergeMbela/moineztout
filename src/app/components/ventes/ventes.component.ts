import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Product } from '../../models/stock.model';

@Component({
  selector: 'app-ventes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventes.component.html',
  styleUrl: './ventes.component.css'
})
export class VentesComponent implements OnInit {
  venteForm: FormGroup;
  products: Product[] = [];
  totalPrice: number = 0;

  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder
  ) {
    this.venteForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    // S'abonner à la liste des produits pour le select
    this.supabaseService.products$.subscribe(products => {
      this.products = products;
    });
    this.supabaseService.loadProducts();

    // Recalculer le total à chaque changement
    this.venteForm.valueChanges.subscribe(() => this.calculateTotal());
  }

  calculateTotal() {
    const { product_id, quantity } = this.venteForm.value;
    const product = this.products.find(p => p.id === product_id);
    const price = product?.price || 0;
    this.totalPrice = price * (quantity || 0);
  }

  async onSubmit() {
    if (this.venteForm.valid) {
      const { product_id, quantity } = this.venteForm.value;
      const product = this.products.find(p => p.id === product_id);
      const price_unit = product?.price || 0;

      try {
        await this.supabaseService.createVente({
          product_id,
          quantity,
          price_unit,
          total_price: this.totalPrice
        });
        
        // Reset du formulaire
        this.venteForm.reset({ quantity: 1 });
        this.totalPrice = 0;
        alert('Vente enregistrée avec succès !');
      } catch (error) {
        console.error('Erreur vente:', error);
        alert('Erreur lors de l\'enregistrement de la vente.');
      }
    }
  }
}
