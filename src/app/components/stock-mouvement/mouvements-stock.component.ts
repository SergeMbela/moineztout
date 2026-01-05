import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-mouvements-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mouvements-stock.component.html',
  styleUrls: ['./mouvements-stock.component.css']
})
export class MouvementsStockComponent implements OnInit {
  mouvements: any[] = [];
  parfums: any[] = [];
  
  selectedMouvement: any = { 
    id_mouvement: null, 
    id_parfum: null, 
    type_mouvement: 'Ajustement', 
    quantite: 0, 
    ref_document: '' 
  };
  isEditing = false;
  loading = false;
  saving = false;

  typesMouvement = ['Vente_Client', 'Achat_Fournisseur', 'Ajustement', 'Retour_Client', 'Perte_Vol'];

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
      const [mvts, parfumsData] = await Promise.all([
        this.supabaseService.getMouvementsStock(),
        this.supabaseService.getParfums()
      ]);
      this.mouvements = mvts || [];
      this.parfums = parfumsData || [];
    } catch (error) {
      console.error('Erreur chargement données mouvements', error);
      this.toastService.error('Impossible de charger les données');
    } finally {
      this.loading = false;
    }
  }

  selectMouvement(mvt: any) {
    this.selectedMouvement = { ...mvt };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedMouvement = { 
      id_mouvement: null, 
      id_parfum: null, 
      type_mouvement: 'Ajustement', 
      quantite: 0, 
      ref_document: '' 
    };
    this.isEditing = false;
  }

  async saveMouvement() {
    if (!this.selectedMouvement.id_parfum || !this.selectedMouvement.quantite) {
      this.toastService.error('Veuillez remplir les champs obligatoires');
      return;
    }

    this.saving = true;

    try {
      await this.rpcService.upsertMouvementStock(
        this.selectedMouvement.id_mouvement,
        this.selectedMouvement.id_parfum,
        this.selectedMouvement.type_mouvement,
        this.selectedMouvement.quantite,
        this.selectedMouvement.ref_document
      );
      this.toastService.success('Mouvement enregistré');
      this.loadData();
      this.resetForm();
    } catch (error: any) {
      console.error('Erreur sauvegarde mouvement', error);
      this.toastService.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement"}`);
    } finally {
      this.saving = false;
    }
  }

  async deleteMouvement(id: number) {
    if (!confirm('Supprimer ce mouvement ?')) return;
    try {
      await this.supabaseService.deleteMouvementStock(id);
      this.toastService.success('Mouvement supprimé');
      this.loadData();
      if (this.selectedMouvement.id_mouvement === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression mouvement', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }
}