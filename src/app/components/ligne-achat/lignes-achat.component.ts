import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service'; 
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-lignes-achat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="flex items-center gap-4">
          <a routerLink="/commandes-fournisseurs" class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">
            Commande <span *ngIf="idCmd" class="text-indigo-600">#{{ idCmd }}</span>
          </h1>
        </div>
        
        <div *ngIf="commande" class="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 flex items-center gap-2">
          <span class="font-medium text-gray-900">{{ commande.fournisseur?.nom_fournisseur }}</span>
          <span class="text-gray-300">|</span>
          <span>{{ commande.date_commande | date:'dd/MM/yyyy' }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Formulaire -->
        <div class="lg:col-span-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="w-1 h-6 bg-indigo-500 rounded-full"></span>
              {{ isEditing ? 'Modifier la ligne' : 'Ajouter une ligne' }}
            </h2>

            <form (ngSubmit)="saveLigne()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Parfum</label>
                <select [(ngModel)]="selectedLigne.id_parfum" name="id_parfum" (change)="onParfumChange()"
                  class="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white">
                  <option [ngValue]="null">Sélectionner...</option>
                  <option *ngFor="let p of parfums" [ngValue]="p.id_parfum">{{ p.nom_parfum }}</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Qté Cmd</label>
                  <input type="number" [(ngModel)]="selectedLigne.quantite_commandee" name="quantite_commandee" min="1"
                    class="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Qté Reçue</label>
                  <input type="number" [(ngModel)]="selectedLigne.quantite_recue" name="quantite_recue" min="0"
                    class="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prix Achat (Unitaire)</label>
                <div class="relative">
                  <input type="number" [(ngModel)]="selectedLigne.prix_achat_unitaire" name="prix_achat_unitaire" step="0.01"
                    class="w-full rounded-lg border-gray-300 border p-2.5 pl-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                  <span class="absolute left-3 top-2.5 text-gray-500">€</span>
                </div>
              </div>

              <div class="pt-2 flex gap-3">
                <button type="submit" [disabled]="!selectedLigne.id_parfum || loading || saving"
                  class="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex justify-center items-center">
                  <svg *ngIf="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isEditing ? 'Mettre à jour' : 'Ajouter une nouvelle ligne' }}
                </button>
                <button *ngIf="isEditing" type="button" (click)="deleteLigne(selectedLigne.id_ligne)"
                  class="px-4 py-2.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-all font-medium">
                  Supprimer
                </button>
                <button *ngIf="isEditing" type="button" (click)="resetForm()"
                  class="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium">
                  Ajouter une nouvelle ligne
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Tableau -->
        <div class="lg:col-span-8">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-gray-600">
                <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th class="px-6 py-4">Parfum</th>
                    <th class="px-6 py-4 text-center">Qté Cmd</th>
                    <th class="px-6 py-4 text-center">Qté Reçue</th>
                    <th class="px-6 py-4 text-right">Prix U.</th>
                    <th class="px-6 py-4 text-right">Total</th>
                    <th class="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr *ngFor="let ligne of lignes" class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900">
                      {{ ligne.parfums?.nom_parfum || 'Inconnu' }}
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ ligne.quantite_commandee }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 text-green-800': ligne.quantite_recue >= ligne.quantite_commandee,
                          'bg-yellow-100 text-yellow-800': ligne.quantite_recue < ligne.quantite_commandee && ligne.quantite_recue > 0,
                          'bg-gray-100 text-gray-800': ligne.quantite_recue === 0
                        }">
                        {{ ligne.quantite_recue }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      {{ ligne.prix_achat_unitaire | currency:'EUR':'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 text-right font-semibold text-gray-900">
                      {{ (ligne.quantite_recue * ligne.prix_achat_unitaire) | currency:'EUR':'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex justify-center gap-2">
                        <button (click)="selectLigne(ligne)" class="p-1 text-blue-600 hover:text-blue-800 transition-colors" title="Modifier">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button (click)="deleteLigne(ligne.id_ligne)" class="p-1 text-red-600 hover:text-red-800 transition-colors" title="Supprimer">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="lignes.length === 0">
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                      <p class="text-base">Aucune ligne d'achat pour cette commande.</p>
                      <button type="button" (click)="resetForm()" class="mt-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm">
                        Ajouter une nouvelle ligne
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-50" *ngIf="lignes.length > 0">
                  <tr>
                    <td colspan="4" class="px-6 py-4 text-right font-bold text-gray-700">Total Estimé :</td>
                    <td class="px-6 py-4 text-right font-bold text-indigo-600 text-lg">{{ getTotal() | currency:'EUR':'symbol':'1.2-2' }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LignesAchatComponent implements OnInit {
  idCmd: number | null = null;
  commande: any = null;
  lignes: any[] = [];
  parfums: any[] = [];

  selectedLigne: any = { 
    id_ligne: null, 
    id_parfum: null, 
    quantite_commandee: 1, 
    quantite_recue: 0, 
    prix_achat_unitaire: 0 
  };
  isEditing = false;
  loading = false;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private rpcService: RpcService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idCmd = +params['id'];
      if (this.idCmd) {
        this.loadData();
      } else {
        this.toastService.error('Aucune commande spécifiée');
        this.router.navigate(['/commandes-fournisseurs']);
      }
    });
  }

  async loadData() {
    this.loading = true;
    try {
      if (this.idCmd) {
        const [cmd, lignesData, parfumsData] = await Promise.all([
          this.supabaseService.getCommandeFournisseur(this.idCmd),
          this.supabaseService.getLignesAchat(this.idCmd),
          this.supabaseService.getParfums()
        ]);
        this.commande = cmd;
        this.lignes = lignesData || [];
        this.parfums = parfumsData || [];
      }
    } catch (error) {
      console.error('Erreur chargement lignes achat', error);
      this.toastService.error('Impossible de charger les données');
    } finally {
      this.loading = false;
    }
  }

  selectLigne(ligne: any) {
    this.selectedLigne = { ...ligne };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedLigne = { 
      id_ligne: null, 
      id_parfum: null, 
      quantite_commandee: 1, 
      quantite_recue: 0, 
      prix_achat_unitaire: 0 
    };
    this.isEditing = false;
  }

  onParfumChange() {
    const p = this.parfums.find(x => x.id_parfum == this.selectedLigne.id_parfum);
    if (p) {
      this.selectedLigne.prix_achat_unitaire = p.prix_achat;
    }
  }

  async saveLigne() {
    if (!this.selectedLigne.id_parfum || !this.idCmd) return;

    this.saving = true;
    try {
      await this.rpcService.upsertLigneAchat(
        this.selectedLigne.id_ligne,
        this.idCmd,
        this.selectedLigne.id_parfum,
        this.selectedLigne.quantite_commandee,
        this.selectedLigne.quantite_recue,
        this.selectedLigne.prix_achat_unitaire
      );
      this.toastService.success('Ligne enregistrée');
      this.loadData();
      this.resetForm();
    } catch (error: any) {
      console.error('Erreur sauvegarde ligne', error);
      this.toastService.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement"}`);
    } finally {
      this.saving = false;
    }
  }

  async deleteLigne(id: number) {
    if (!confirm('Supprimer cette ligne ?')) return;
    try {
      await this.supabaseService.deleteLigneAchat(id);
      this.toastService.success('Ligne supprimée');
      this.loadData();
      if (this.selectedLigne.id_ligne === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression ligne', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }

  getTotal() {
    return this.lignes.reduce((acc, l) => acc + (l.quantite_commandee * (l.prix_achat_unitaire || 0)), 0);
  }
}