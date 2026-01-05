import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service'
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-marques',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marques.component.html',
  styleUrls: ['./marques.component.css']
})
export class MarquesComponent implements OnInit {
  marques: any[] = [];
  selectedMarque: any = { id_marque: null, nom_marque: '', pays_origine: '' };
  isEditing = false;
  loading = false;

  constructor(
    private supabaseService: SupabaseService,
    private rpcService: RpcService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadMarques();
  }

  async loadMarques() {
    this.loading = true;
    try {
      this.marques = await this.supabaseService.getMarques() || [];
    } catch (error) {
      console.error('Erreur chargement marques', error);
      this.toastService.error('Impossible de charger les marques');
    } finally {
      this.loading = false;
    }
  }

  selectMarque(marque: any) {
    this.selectedMarque = { ...marque };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedMarque = { id_marque: null, nom_marque: '', pays_origine: '' };
    this.isEditing = false;
  }

  async saveMarque() {
    if (!this.selectedMarque.nom_marque) return;

    try {
      await this.rpcService.upsertMarque(
        this.selectedMarque.id_marque,
        this.selectedMarque.nom_marque,
        this.selectedMarque.pays_origine
      );
      this.toastService.success('Marque enregistrée avec succès');
      this.loadMarques();
      this.resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde marque', error);
      this.toastService.error('Erreur lors de l\'enregistrement');
    }
  }

  async deleteMarque(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) return;
    try {
      await this.supabaseService.deleteMarque(id);
      this.toastService.success('Marque supprimée');
      this.loadMarques();
      if (this.selectedMarque.id_marque === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression marque', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }
}