import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-modes-livraison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modes-livraison.component.html',
  styleUrls: ['./modes-livraison.component.css']
})
export class ModesLivraisonComponent implements OnInit {
  modes: any[] = [];
  selectedMode: any = { id_mode: null, nom_mode: '', transporter: '', delai_estime_jours: 0, cout_standard: 0 };
  isEditing = false;
  loading = false;

  constructor(
    private supabaseService: SupabaseService,
    private rpcService: RpcService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadModes();
  }

  async loadModes() {
    this.loading = true;
    try {
      this.modes = await this.supabaseService.getModesLivraison() || [];
    } catch (error) {
      console.error('Erreur chargement modes livraison', error);
      this.toastService.error('Impossible de charger les modes de livraison');
    } finally {
      this.loading = false;
    }
  }

  selectMode(mode: any) {
    this.selectedMode = { ...mode };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedMode = { id_mode: null, nom_mode: '', transporter: '', delai_estime_jours: 0, cout_standard: 0 };
    this.isEditing = false;
  }

  async saveMode() {
    if (!this.selectedMode.nom_mode) return;

    try {
      await this.rpcService.upsertModeLivraison(
        this.selectedMode.id_mode,
        this.selectedMode.nom_mode,
        this.selectedMode.transporter,
        this.selectedMode.delai_estime_jours,
        this.selectedMode.cout_standard
      );
      this.toastService.success('Mode de livraison enregistré avec succès');
      this.loadModes();
      this.resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde mode livraison', error);
      this.toastService.error('Erreur lors de l\'enregistrement');
    }
  }

  async deleteMode(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mode de livraison ?')) return;
    try {
      await this.supabaseService.deleteModeLivraison(id);
      this.toastService.success('Mode de livraison supprimé');
      this.loadModes();
      if (this.selectedMode.id_mode === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression mode livraison', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }
}