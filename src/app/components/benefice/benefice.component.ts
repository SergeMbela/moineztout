import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

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

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

@Component({
  selector: 'app-benefice',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
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
  totalBeneficeReel = 0;
  searchTerm: string = '';
  loading = true;
  sortColumn: string = 'beneficeStock';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Propriétés pour l'historique des ventes
  selectedParfumHistory: any[] = [];
  selectedParfumName: string = '';
  showHistoryModal: boolean = false;
  loadingHistory: boolean = false;

  // Configuration du graphique historique
  public historyChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Quantité Vendue',
        fill: true,
        tension: 0.4,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5'
      }
    ]
  };

  public historyChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => `Quantité: ${c.parsed.y}` } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { grid: { display: false } }
    }
  };

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const [parfums, lignesVenteResult] = await Promise.all([
        this.supabaseService.getParfums(),
        // Note: This assumes `supabaseService.supabase` is a public SupabaseClient instance.
        this.supabaseService.client.from('mo_ligne_vente').select(`
          quantite,
          prix_unitaire_facture,
          parfums:mo_parfums (
            prix_achat
          )
        `)
      ]);

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

      const { data: lignesVente, error: errorLignes } = lignesVenteResult;
      if (errorLignes) throw errorLignes;

      if (lignesVente) {
        this.totalBeneficeReel = lignesVente.reduce((sum, ligne: any) => {
          const parfum = Array.isArray(ligne.parfums) ? ligne.parfums[0] : ligne.parfums;
          const prixAchat = Number(parfum?.prix_achat || 0);
          const prixVente = Number(ligne.prix_unitaire_facture || 0);
          const quantite = Number(ligne.quantite || 0);
          const beneficeLigne = (prixVente - prixAchat) * quantite;
          return sum + beneficeLigne;
        }, 0);
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

  async openHistoryModal(item: any) {
    this.selectedParfumName = item.nom;
    this.showHistoryModal = true;
    this.loadingHistory = true;
    this.selectedParfumHistory = [];

    try {
      const { data, error } = await this.supabaseService.client
        .from('mo_ligne_vente')
        .select(`
          quantite,
          prix_unitaire_facture,
          mo_commandes_clients (
            id_cmd_client,
            date_commande,
            statut
          )
        `)
        .eq('id_parfum', item.id);

      if (error) throw error;

      if (data) {
        this.selectedParfumHistory = data
          .map((line: any) => ({
            date: line.mo_commandes_clients?.date_commande,
            id_cmd: line.mo_commandes_clients?.id_cmd_client,
            statut: line.mo_commandes_clients?.statut,
            quantite: line.quantite,
            prix_unitaire: line.prix_unitaire_facture,
            total: line.quantite * line.prix_unitaire_facture
          }))
          // Tri par date décroissante
          .sort((a: any, b: any) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

        // Préparation des données pour le graphique (Tri chronologique croissant)
        const chartDataMap = new Map<string, number>();
        const sortedForChart = [...data].sort((a: any, b: any) => {
          const dateA = new Date(a.mo_commandes_clients?.date_commande || 0).getTime();
          const dateB = new Date(b.mo_commandes_clients?.date_commande || 0).getTime();
          return dateA - dateB;
        });

        sortedForChart.forEach((line: any) => {
          if (line.mo_commandes_clients?.date_commande) {
            const dateLabel = new Date(line.mo_commandes_clients.date_commande).toLocaleDateString('fr-FR');
            const qty = Number(line.quantite || 0);
            chartDataMap.set(dateLabel, (chartDataMap.get(dateLabel) || 0) + qty);
          }
        });
        this.historyChartData.labels = Array.from(chartDataMap.keys());
        this.historyChartData.datasets[0].data = Array.from(chartDataMap.values());
        this.historyChartData = { ...this.historyChartData }; // Force refresh
      }
    } catch (err) {
      console.error('Erreur chargement historique', err);
    } finally {
      this.loadingHistory = false;
    }
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
  }
}
