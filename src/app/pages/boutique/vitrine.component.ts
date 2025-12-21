import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { BoutiqueItem } from '../../models/boutique.model';

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vitrine.component.html',
  styleUrls: ['./vitrine.component.css']
})
export class VitrineComponent implements OnInit {
  private supabase = inject(SupabaseService);
  
  // On utilise 'any[]' pour accommoder la propriété 'products' (stock) qui vient de la jointure
  items: any[] = []; 
  loading = true;

  async ngOnInit() {
    try {
      // true = on ne charge que les articles marqués comme "actifs"
      this.items = await this.supabase.getBoutiqueItems(true) || [];
    } catch (error) {
      console.error('Erreur chargement vitrine', error);
    } finally {
      this.loading = false;
    }
  }

  addToCart(item: BoutiqueItem) {
    // Placeholder pour la future logique de panier
    console.log('Ajout au panier:', item);
    alert(`Article ajouté au panier : ${item.title}`);
  }

  onImageError(event: any) {
    event.target.src = 'assets/placeholder-perfume.jpg';
    event.target.onerror = null;
  }
}