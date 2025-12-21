import { Routes } from '@angular/router';
import { StockManagerComponent } from './components/stock-manager/stock-manager.component';
import { FournisseursComponent } from './components/fournisseurs/fournisseurs.component';
import { ProspectsComponent } from './components/prospects/prospects.component';
import { CommissionsComponent } from './components/commissions/commissions.component';
import { AchatFournisseursComponent } from './components/achat-fournisseurs/achat-fournisseurs.component';
import { VentesComponent } from './components/ventes/ventes.component';
import { CaComponent } from './components/ca/ca.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { BoutiqueComponent } from './pages/boutique/boutique.component';

export const routes: Routes = [
  { path: '', redirectTo: 'stock', pathMatch: 'full' },
  { path: 'stock', component: StockManagerComponent },
  { path: 'fournisseurs', component: FournisseursComponent },
  { path: 'approvisionnement', component: AchatFournisseursComponent },
  { path: 'prospects', component: ProspectsComponent },
  { path: 'commissions', component: CommissionsComponent },
  { path: 'ventes', component: VentesComponent },
    { path: 'boutique', component: BoutiqueComponent },
  { path: 'ca', component: CaComponent },
  { path: '**', component: PageNotFoundComponent }
];