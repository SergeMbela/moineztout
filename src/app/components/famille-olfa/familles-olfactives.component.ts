import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-familles-olfactives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './familles-olfactives.component.html',
  styleUrls: ['./familles-olfactives.component.css']
})
export class FamillesOlfactivesComponent implements OnInit {
  familles: any[] = [];
  selectedFamille: any = { id_famille: null, nom_famille: '', description: '' };
  isEditing = false;
  loading = false;

  constructor(
    private supabaseService: SupabaseService,
    private rpcService: RpcService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadFamilles();
  }

  async loadFamilles() {
    this.loading = true;
    try {
      this.familles = await this.supabaseService.getFamillesOlfactives() || [];
    } catch (error) {
      console.error('Erreur chargement familles', error);
      this.toastService.error('Impossible de charger les familles olfactives');
    } finally {
      this.loading = false;
    }
  }

  selectFamille(famille: any) {
    this.selectedFamille = { ...famille };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedFamille = { id_famille: null, nom_famille: '', description: '' };
    this.isEditing = false;
  }

  async saveFamille() {
    if (!this.selectedFamille.nom_famille) return;

    try {
      await this.rpcService.upsertFamilleOlfactive(
        this.selectedFamille.id_famille,
        this.selectedFamille.nom_famille,
        this.selectedFamille.description
      );
      this.toastService.success('Famille olfactive enregistrée avec succès');
      this.loadFamilles();
      this.resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde famille', error);
      this.toastService.error('Erreur lors de l\'enregistrement');
    }
  }

  async deleteFamille(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette famille olfactive ?')) return;
    try {
      await this.supabaseService.deleteFamilleOlfactive(id);
      this.toastService.success('Famille olfactive supprimée');
      this.loadFamilles();
      if (this.selectedFamille.id_famille === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression famille', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }
}