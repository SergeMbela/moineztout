import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: any[] = [];
  selectedClient: any = {
    id_client: null,
    nom: '',
    prenom: '',
    email: '',
    adresse_defaut: '',
    telephone: ''
  };
  isEditing = false;
  loading = false;

  constructor(
    private supabaseService: SupabaseService,
    private rpcService: RpcService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  async loadClients() {
    this.loading = true;
    try {
      this.clients = await this.supabaseService.getClients() || [];
    } catch (error) {
      console.error('Erreur chargement clients', error);
      this.toastService.error('Impossible de charger les clients');
    } finally {
      this.loading = false;
    }
  }

  selectClient(client: any) {
    this.selectedClient = { ...client };
    this.isEditing = true;
  }

  resetForm() {
    this.selectedClient = {
      id_client: null,
      nom: '',
      prenom: '',
      email: '',
      adresse_defaut: '',
      telephone: ''
    };
    this.isEditing = false;
  }

  async saveClient() {
    if (!this.selectedClient.nom || !this.selectedClient.email) return;

    try {
      await this.rpcService.upsertClient(
        this.selectedClient.id_client,
        this.selectedClient.nom,
        this.selectedClient.prenom,
        this.selectedClient.email,
        this.selectedClient.adresse_defaut,
        this.selectedClient.telephone
      );
      this.toastService.success('Client enregistré avec succès');
      this.loadClients();
      this.resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde client', error);
      this.toastService.error('Erreur lors de l\'enregistrement');
    }
  }

  async deleteClient(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    try {
      await this.supabaseService.deleteClient(id);
      this.toastService.success('Client supprimé');
      this.loadClients();
      if (this.selectedClient.id_client === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression client', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }
}