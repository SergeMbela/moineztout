import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MarquesComponent } from './components/marques/marques.component';
import { FamillesOlfactivesComponent } from './components/famille-olfa/familles-olfactives.component';
import { ParfumsComponent } from './components/parfums/parfums.component';
import { FournisseursComponent } from './components/fournisseurs/fournisseurs.component';
import { ClientsComponent } from './components/clients/clients.component';
import { ModesLivraisonComponent } from './components/mode-livraison/modes-livraison.component';
import { CommandesClientsComponent } from './components/commande-clients/commandes-clients.component';
import { LignesVenteComponent } from './components/commande-clients/lignes-vente.component';
import { CommandesFournisseursComponent } from './components/commande-fournisseur/commandes-fournisseurs.component';
import { LignesAchatComponent } from './components/ligne-achat/lignes-achat.component';
import { MouvementsStockComponent } from './components/stock-mouvement/mouvements-stock.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'marques', component: MarquesComponent },
  { path: 'familles-olfactives', component: FamillesOlfactivesComponent },
  { path: 'parfums', component: ParfumsComponent },
  { path: 'fournisseurs', component: FournisseursComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'modes-livraison', component: ModesLivraisonComponent },
  { path: 'commandes-clients', component: CommandesClientsComponent },
  { path: 'commandes-clients/:id/lignes', component: LignesVenteComponent },
  { path: 'commandes-fournisseurs', component: CommandesFournisseursComponent },
  { path: 'commandes-fournisseurs/:id/lignes', component: LignesAchatComponent },
  { path: 'mouvements-stock', component: MouvementsStockComponent },
];