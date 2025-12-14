import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-ca',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ca.component.html',
  styleUrls: ['./ca.component.css']
})
export class CaComponent implements OnInit {
  totalCA: number = 0;
  salesByProduct: any[] = [];
  loading = true;
  chart: any;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const sales = await this.supabaseService.getVentesHistory();
      this.calculateMetrics(sales || []);
      this.renderChart(sales || []);
    } catch (error) {
      console.error('Erreur chargement CA', error);
    } finally {
      this.loading = false;
    }
  }

  calculateMetrics(sales: any[]) {
    // 1. Calcul du CA Total
    this.totalCA = sales.reduce((acc, sale) => acc + Number(sale.total_price), 0);

    // 2. Regroupement par produit
    const map = new Map<string, { name: string, sku: string, quantity: number, total: number }>();

    sales.forEach(sale => {
      // Supabase retourne les relations jointes (products)
      const productData = Array.isArray(sale.products) ? sale.products[0] : sale.products;
      const pId = sale.product_id;
      const pName = productData?.name || 'Produit inconnu/supprimé';
      const pSku = productData?.sku || '???';

      if (!map.has(pId)) {
        map.set(pId, { name: pName, sku: pSku, quantity: 0, total: 0 });
      }
      const entry = map.get(pId)!;
      entry.quantity += sale.quantity;
      entry.total += Number(sale.total_price);
    });

    // Conversion en tableau et tri par CA décroissant
    this.salesByProduct = Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  renderChart(sales: any[]) {
    if (this.chart) this.chart.destroy();

    // 1. Trier les ventes par date (ancien -> récent)
    const sortedSales = [...sales].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // 2. Grouper par jour
    const dataMap = new Map<string, number>();
    sortedSales.forEach(sale => {
      const date = new Date(sale.created_at).toLocaleDateString('fr-FR');
      dataMap.set(date, (dataMap.get(date) || 0) + Number(sale.total_price));
    });

    // 3. Créer le graphique
    this.chart = new Chart('caChart', {
      type: 'line',
      data: {
        labels: Array.from(dataMap.keys()),
        datasets: [{
          label: "Chiffre d'Affaires (€)",
          data: Array.from(dataMap.values()),
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          fill: true,
          tension: 0.4 // Courbe lissée
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } }
      }
    });
  }
}