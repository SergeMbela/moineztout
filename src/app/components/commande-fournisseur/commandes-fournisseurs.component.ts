import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-commandes-fournisseurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './commandes-fournisseurs.component.html',
  styleUrls: ['./commandes-fournisseurs.component.css']
})
export class CommandesFournisseursComponent implements OnInit {
  commandes: any[] = [];
  fournisseurs: any[] = [];
  
  selectedCommande: any = { id_cmd_fourn: null, id_fournisseur: null, statut: 'Brouillon' };
  isEditing = false;
  loading = false;
  saving = false;

  statuts = ['Brouillon', 'Envoyée', 'Recue', 'Annulée'];

  constructor(
    private supabaseService: SupabaseService,
    private rpcService: RpcService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const [cmds, suppliers] = await Promise.all([
        this.supabaseService.getCommandesFournisseurs(),
        this.supabaseService.getSuppliersList()
      ]);
      this.commandes = cmds || [];
      this.fournisseurs = suppliers || [];
    } catch (error) {
      console.error('Erreur chargement données commandes fournisseurs', error);
      this.toastService.error('Impossible de charger les données');
    } finally {
      this.loading = false;
    }
  }

  selectCommande(cmd: any) {
    this.selectedCommande = { ...cmd };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedCommande = { id_cmd_fourn: null, id_fournisseur: null, statut: 'Brouillon' };
    this.isEditing = false;
  }

  async saveCommande() {
    if (!this.selectedCommande.id_fournisseur) {
      this.toastService.error('Veuillez sélectionner un fournisseur');
      return;
    }

    this.saving = true;

    try {
      await this.rpcService.upsertCommandeFournisseur(
        this.selectedCommande.id_cmd_fourn,
        this.selectedCommande.id_fournisseur,
        this.selectedCommande.statut
      );
      this.toastService.success('Commande fournisseur enregistrée');
      this.loadData();
      this.resetForm();
    } catch (error: any) {
      console.error('Erreur sauvegarde commande fournisseur', error);
      if (error.details) console.error('Détails techniques:', error.details);
      if (error.hint) console.error('Indice:', error.hint);
      this.toastService.error(`Erreur: ${error.message || "Échec de l'enregistrement"}`);
    } finally {
      this.saving = false;
    }
  }

  async deleteCommande(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;
    try {
      await this.supabaseService.deleteCommandeFournisseur(id);
      this.toastService.success('Commande supprimée');
      this.loadData();
      if (this.selectedCommande.id_cmd_fourn === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression commande', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }
}