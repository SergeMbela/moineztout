import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface BeneficeRow {
  id: number;
  nom: string;
  marque: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  margeUnitaire: number;
  tauxMarque: number; // (Marge / Prix Vente) * 100
  beneficeStock: number;
}

@Component({
  selector: 'app-benefice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './benefice.component.html',
  styleUrl: './benefice.component.css'
})
export class BeneficeComponent implements OnInit {
  benefices: BeneficeRow[] = [];
  filteredBenefices: BeneficeRow[] = [];
  paginatedBenefices: BeneficeRow[] = [];
  
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pageOptions = [5, 10, 20, 50, 100];

  totalBeneficePotentiel = 0;
  searchTerm: string = '';
  loading = true;
  sortColumn: string = 'beneficeStock';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const parfums = await this.supabaseService.getParfums();
      
      if (parfums) {
        this.benefices = parfums.map((p: any) => {
          const pa = Number(p.prix_achat);
          const pv = Number(p.prix_vente);
          const stock = p.stock_actuel || 0;
          const marge = pv - pa;
          // Taux de marque : part de la marge dans le prix de vente
          const taux = pv !== 0 ? (marge / pv) * 100 : 0;
          
          return {
            id: p.id_parfum,
            nom: p.nom_parfum,
            marque: p.marques?.nom_marque || 'N/A',
            prixAchat: pa,
            prixVente: pv,
            stock: stock,
            margeUnitaire: marge,
            tauxMarque: taux,
            beneficeStock: marge * stock
          };
        });

        // Calcul du total global
        this.totalBeneficePotentiel = this.benefices.reduce((sum, item) => sum + item.beneficeStock, 0);
        
        // Initialiser les données filtrées et trier
        this.filterData();
      }
    } catch (error) {
      console.error('Erreur calcul bénéfices:', error);
    } finally {
      this.loading = false;
    }
  }

  filterData() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredBenefices = [...this.benefices];
    } else {
      this.filteredBenefices = this.benefices.filter(item => 
        item.nom.toLowerCase().includes(term) || 
        item.marque.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.applySort();
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.applySort();
  }

  applySort() {
    const column = this.sortColumn;
    this.filteredBenefices.sort((a: any, b: any) => {
      let valA = a[column];
      let valB = b[column];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredBenefices.length / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedBenefices = this.filteredBenefices.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return ' ↕';
    return this.sortDirection === 'asc' ? ' ▲' : ' ▼';
  }
}
