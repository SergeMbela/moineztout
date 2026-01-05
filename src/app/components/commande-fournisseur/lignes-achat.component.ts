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
  templateUrl: './lignes-achat.component.html'
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
    // Récupération de l'ID depuis l'URL (ex: /commandes-fournisseurs/123/lignes)
    this.idCmd = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idCmd) {
      this.loadData();
    } else {
      this.router.navigate(['/commandes-fournisseurs']);
    }
  }

  async loadData() {
    this.loading = true;
    try {
      const [cmd, lignesData, parfumsData] = await Promise.all([
        this.supabaseService.getCommandeFournisseur(this.idCmd!),
        this.supabaseService.getLignesAchat(this.idCmd!),
        this.supabaseService.getParfums()
      ]);
      this.commande = cmd;
      this.lignes = lignesData || [];
      this.parfums = parfumsData || [];
    } catch (error) {
      console.error('Erreur chargement', error);
      this.toastService.error('Impossible de charger les détails de la commande');
    } finally {
      this.loading = false;
    }
  }

  // Met à jour le prix d'achat automatiquement quand on choisit un parfum
  onParfumChange() {
    const p = this.parfums.find(x => x.id_parfum == this.selectedLigne.id_parfum);
    if (p) {
      this.selectedLigne.prix_achat_unitaire = p.prix_achat;
    }
  }

  resetForm() {
    this.selectedLigne = {
      id_ligne: null,
      id_parfum: null,
      quantite_commandee: 1,
      quantite_recue: 0,
      prix_achat_unitaire: 0
    };
  }

  editLigne(ligne: any) {
    this.selectedLigne = { ...ligne };
  }

  async saveLigne() {
    if (!this.selectedLigne.id_parfum || this.selectedLigne.quantite_commandee < 1) return;

    this.saving = true;
    try {
      await this.rpcService.upsertLigneAchat(
        this.selectedLigne.id_ligne,
        this.idCmd!,
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
    } catch (error) {
      console.error('Erreur suppression', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }

  getTotal() {
    return this.lignes.reduce((acc, l) => acc + (l.quantite_commandee * (l.prix_achat_unitaire || 0)), 0);
  }
}