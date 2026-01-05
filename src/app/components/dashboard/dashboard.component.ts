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
  PieController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(LineController, PieController, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  stats: any = {
    ca: 0,
    nb_commandes: 0,
    alerte_stock: 0,
    ca_progression: 0,
    nb_commandes_progression: 0
  };
  recentSales: any[] = [];
  topProducts: any[] = [];
  loading = true;
  startDate: string | null = null;
  endDate: string | null = null;

  // Configuration du graphique
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Chiffre d\'Affaires (€)',
        fill: true,
        tension: 0.4,
        borderColor: '#4f46e5', // Indigo 600
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5'
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { callback: (value) => typeof value === 'number' ? value + ' €' : value }
      },
      x: { grid: { display: false } }
    }
  };

  // Configuration du graphique circulaire (Pie Chart)
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#4f46e5', // Indigo
        '#ec4899', // Violet
        '#10b981', // Vert
        '#f59e0b', // Jaune
        '#3b82f6', // Bleu
        '#ef4444', // Rouge
        '#6366f1', // Indigo clair
        '#8b5cf6'  // Violet clair
      ]
    }]
  };

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading = true;
    try {
      // 1. Récupérer les alertes de stock (toujours global)
      const globalStats = await this.supabaseService.getDashboardStats();
      let ca = globalStats.ca_mois_en_cours;
      let nb_commandes = globalStats.nb_commandes_mois;
      let caProgression = 0;
      let cmdProgression = 0;

      // 2. Si filtre activé, récupérer les stats de la période
      if (this.startDate && this.endDate) {
        const periodStats = await this.supabaseService.getStatsForPeriod(this.startDate, this.endDate);
        ca = periodStats.ca;
        nb_commandes = periodStats.count;
        
        this.recentSales = await this.supabaseService.getVentesHistory(this.startDate, this.endDate);
        this.topProducts = await this.supabaseService.getTopSellingProducts(this.startDate, this.endDate);
      } else {
        // Sinon, comportement par défaut (mois en cours) + Calcul progression
        this.recentSales = await this.supabaseService.getVentesHistory();
        this.topProducts = await this.supabaseService.getTopSellingProducts();

        // Calcul de la progression (Mois en cours vs Mois dernier à la même date)
        const today = new Date();
        const startPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        
        // Gérer la fin du mois précédent (ex: si on est le 31 mars, on compare au 28/29 février)
        const daysInPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        const currentDay = today.getDate();
        const prevMonthDay = Math.min(currentDay, daysInPrevMonth);
        const endPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, prevMonthDay);

        const prevStats = await this.supabaseService.getStatsForPeriod(
          this.formatDate(startPrevMonth),
          this.formatDate(endPrevMonth)
        );

        if (prevStats.ca > 0) {
          caProgression = ((ca - prevStats.ca) / prevStats.ca) * 100;
        }
        if (prevStats.count > 0) {
          cmdProgression = ((nb_commandes - prevStats.count) / prevStats.count) * 100;
        }
      }

      // Mise à jour de l'objet stats pour l'affichage
      this.stats = { 
        ca, 
        nb_commandes, 
        alerte_stock: globalStats.alerte_stock,
        ca_progression: caProgression,
        nb_commandes_progression: cmdProgression
      };

      // Charge les données du graphique
      const chartData = await this.supabaseService.getMonthlyRevenueStats();
      this.lineChartData.labels = chartData.labels;
      this.lineChartData.datasets[0].data = chartData.data;
      this.lineChartData = { ...this.lineChartData }; // Force update

      // Charge les données du Pie Chart (Familles)
      const familyData = await this.supabaseService.getSalesByFamilyStats();
      this.pieChartData.labels = familyData.labels;
      this.pieChartData.datasets[0].data = familyData.data;
      this.pieChartData = { ...this.pieChartData }; // Force update
    } catch (error) {
      console.error('Erreur chargement dashboard', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    if (this.startDate && this.endDate) {
      this.loadDashboardData();
    }
  }

  resetFilter() {
    this.startDate = null;
    this.endDate = null;
    this.loadDashboardData();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}