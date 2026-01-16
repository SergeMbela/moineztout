import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-types-conditionnement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './types-conditionnement.component.html'
})
export class TypesConditionnementComponent implements OnInit {
  types: any[] = [];
  selectedType: any = { id_type: null, nom_type: '', description: '' };
  isEditing = false;
  loading = false;
  saving = false;

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
      this.types = await this.supabaseService.getTypesConditionnement() || [];
    } catch (error) {
      console.error('Erreur chargement', error);
      this.toastService.error('Impossible de charger les données');
    } finally {
      this.loading = false;
    }
  }

  selectType(item: any) {
    this.selectedType = { ...item };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedType = { id_type: null, nom_type: '', description: '' };
    this.isEditing = false;
  }

  async saveType() {
    if (!this.selectedType.nom_type) {
      this.toastService.error('Le nom est obligatoire');
      return;
    }
    this.saving = true;
    try {
      await this.rpcService.upsertTypeConditionnement(
        this.selectedType.id_type,
        this.selectedType.nom_type,
        this.selectedType.description
      );
      this.toastService.success('Type de conditionnement enregistré');
      this.loadData();
      this.resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      this.toastService.error('Erreur lors de l\'enregistrement');
    } finally {
      this.saving = false;
    }
  }

  async deleteType(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type de conditionnement ?')) return;
    try {
      await this.supabaseService.deleteTypeConditionnement(id);
      this.toastService.success('Supprimé avec succès');
      this.loadData();
      if (this.selectedType.id_type === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }
}