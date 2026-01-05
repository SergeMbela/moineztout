import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-commandes-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './commandes-clients.component.html',
  styleUrls: ['./commandes-clients.component.css']
})
export class CommandesClientsComponent implements OnInit {
  commandes: any[] = [];
  clients: any[] = [];
  modesLivraison: any[] = [];

  selectedCommande: any = this.getEmptyCommande();
  isEditing = false;
  loading = false;

  statuts = ['En attente', 'Payée', 'Expédiée', 'Livrée', 'Annulée'];

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
      const [cmds, clientsData, modesData] = await Promise.all([
        this.supabaseService.getCommandesClients(),
        this.supabaseService.getClients(),
        this.supabaseService.getModesLivraison()
      ]);
      this.commandes = cmds || [];
      this.clients = clientsData || [];
      this.modesLivraison = modesData || [];
    } catch (error) {
      console.error('Erreur chargement données commandes', error);
      this.toastService.error('Impossible de charger les données');
    } finally {
      this.loading = false;
    }
  }

  getEmptyCommande() {
    return {
      id_cmd_client: null,
      id_client: null,
      id_mode_livraison: null,
      statut: 'En attente',
      adresse_livraison: '',
      frais_port_factures: 0,
      numero_suivi: '',
      date_expedition: null
    };
  }

  selectCommande(cmd: any) {
    this.selectedCommande = { ...cmd };
    // Format date for input type="date" if necessary, or keep as string if Supabase returns ISO
    if (this.selectedCommande.date_expedition) {
      this.selectedCommande.date_expedition = this.selectedCommande.date_expedition.split('T')[0];
    }
    this.isEditing = true;
  }

  resetForm() {
    this.selectedCommande = this.getEmptyCommande();
    this.isEditing = false;
  }

  async saveCommande() {
    if (!this.selectedCommande.id_client || !this.selectedCommande.id_mode_livraison) {
      this.toastService.error('Veuillez sélectionner un client et un mode de livraison');
      return;
    }

    try {
      await this.rpcService.upsertCommandeClient(
        this.selectedCommande.id_cmd_client,
        this.selectedCommande.id_client,
        this.selectedCommande.id_mode_livraison,
        this.selectedCommande.statut,
        this.selectedCommande.adresse_livraison,
        this.selectedCommande.frais_port_factures,
        this.selectedCommande.numero_suivi,
        this.selectedCommande.date_expedition || null
      );
      this.toastService.success('Commande enregistrée avec succès');
      this.loadData();
      this.resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde commande', error);
      this.toastService.error('Erreur lors de l\'enregistrement');
    }
  }

  async deleteCommande(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;
    try {
      await this.supabaseService.deleteCommandeClient(id);
      this.toastService.success('Commande supprimée');
      this.loadData();
      if (this.selectedCommande.id_cmd_client === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression commande', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }

  getClientName(id: number) {
    const c = this.clients.find(x => x.id_client === id);
    return c ? `${c.nom} ${c.prenom}` : 'Inconnu';
  }
}