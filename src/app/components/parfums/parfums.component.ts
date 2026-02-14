import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-parfums',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parfums.component.html',
  styleUrls: ['./parfums.component.css']
})
export class ParfumsComponent implements OnInit {
  parfums: any[] = [];
  marques: any[] = [];
  familles: any[] = [];
  fournisseurs: any[] = [];
  typesConditionnement: any[] = [];

  selectedParfum: any = this.getEmptyParfum();
  isEditing = false;
  loading = false;
  saving = false;
  uploading = false;
  isSearchingImages = false;
  foundImages: any[] = [];

  genres = ['Homme', 'Femme', 'Unisexe'];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

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
      const [parfumsData, marquesData, famillesData, fournisseursData, typesData] = await Promise.all([
        this.supabaseService.getParfums(),
        this.supabaseService.getMarques(),
        this.supabaseService.getFamillesOlfactives(),
        this.supabaseService.getSuppliersList(),
        this.supabaseService.getTypesConditionnement()
      ]);

      this.parfums = parfumsData || [];
      this.marques = marquesData || [];
      this.familles = famillesData || [];
      this.fournisseurs = fournisseursData || [];
      this.typesConditionnement = typesData || [];
    } catch (error) {
      console.error('Erreur chargement données parfums', error);
      this.toastService.error('Impossible de charger les données');
    } finally {
      this.loading = false;
    }
  }

  getEmptyParfum() {
    return {
      id_parfum: null,
      nom_parfum: '',
      id_marque: null,
      id_famille: null,
      id_fournisseur_prefere: null,
      id_type_conditionnement: null,
      genre: 'Unisexe',
      volume_ml: 100,
      prix_achat: 0,
      prix_vente: 0,
      stock_actuel: 0,
      seuil_alerte: 10,
      url_image_principale: null,
      url_image_secondaire: null,
      url_video_youtube: null
    };
  }

  selectParfum(parfum: any) {
    this.selectedParfum = { ...parfum };
    this.isEditing = true;
    this.foundImages = [];
  }

  resetForm() {
    this.selectedParfum = this.getEmptyParfum();
    this.isEditing = false;
    this.foundImages = [];
  }

  async saveParfum() {
    console.log(this.selectedParfum);
    if (!this.selectedParfum.nom_parfum || !this.selectedParfum.id_marque) {
      this.toastService.error('Veuillez remplir les champs obligatoires (Nom, Marque)');
      return;
    }

    this.saving = true;

    try {
      await this.rpcService.upsertParfum(
        this.selectedParfum.id_parfum,
        this.selectedParfum.nom_parfum,
        this.selectedParfum.id_marque,
        this.selectedParfum.id_famille,
        this.selectedParfum.id_fournisseur_prefere,
        this.selectedParfum.id_type_conditionnement,
        this.selectedParfum.genre,
        this.selectedParfum.volume_ml,
        this.selectedParfum.prix_achat,
        this.selectedParfum.prix_vente,
        this.selectedParfum.stock_actuel,
        this.selectedParfum.seuil_alerte,
        this.selectedParfum.url_image_principale,
        this.selectedParfum.url_image_secondaire,
        this.selectedParfum.url_video_youtube
      );
      this.toastService.success('Parfum enregistré avec succès');
      this.loadData(); // Reload to get updated list with joins
      this.resetForm();
    } catch (error: any) {
      console.error('Erreur sauvegarde parfum', error);
      if (error.details) console.error('Détails techniques:', error.details);
      if (error.hint) console.error('Indice:', error.hint);
      console.log('Données envoyées:', this.selectedParfum);
      console.log('Données envoyées:', error.message);
      this.toastService.error(`Erreur: ${error.message || "Échec de l'enregistrement"}`);
    } finally {
      this.saving = false;
    }
  }

  async deleteParfum(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce parfum ?')) return;
    try {
      await this.supabaseService.deleteParfum(id);
      this.toastService.success('Parfum supprimé');
      this.loadData();
      if (this.selectedParfum.id_parfum === id) this.resetForm();
    } catch (error) {
      console.error('Erreur suppression parfum', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }

  async onFileSelected(event: any, type: 'principale' | 'secondaire') {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      this.toastService.error('L\'image est trop volumineuse (max 1MB)');
      return;
    }

    this.uploading = true;
    const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    try {
      const url = await this.supabaseService.uploadProductImage(file, path);
      if (type === 'principale') {
        this.selectedParfum.url_image_principale = url;
      } else {
        this.selectedParfum.url_image_secondaire = url;
      }
      this.toastService.success('Image uploadée');
    } catch (error) {
      console.error('Erreur upload', error);
      this.toastService.error('Erreur lors de l\'upload');
    } finally {
      this.uploading = false;
    }
  }

  async onFileImport(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      console.log('CSV Content:', text);
      this.toastService.success('Fichier CSV lu (traitement à implémenter)');
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow re-selection
  }

  async autoFillImages() {
    if (!this.selectedParfum.nom_parfum) {
      this.toastService.error('Veuillez renseigner le nom du parfum');
      return;
    }

    this.isSearchingImages = true;
    const marque = this.getMarqueName(this.selectedParfum.id_marque);
    // Construction d'une requête précise pour Google Images
    const query = `${marque !== 'Inconnue' ? marque : ''} ${this.selectedParfum.nom_parfum} parfum bottle`;

    try {
      // Accès au client Supabase via le service (en supposant que la propriété 'supabase' ou 'client' est publique)
      const supabase = (this.supabaseService as any).supabase || (this.supabaseService as any).client;
      
      if (!supabase) {
        throw new Error('Client Supabase non accessible dans SupabaseService');
      }

      const { data, error } = await supabase.functions.invoke('image-google', {
        body: { query, count: 4 },
      });

      if (error) throw error;

      if (data && data.success && data.data && data.data.length > 0) {
        this.foundImages = data.data;
        this.toastService.success(`${data.saved_count} images trouvées. Sélectionnez-les ci-dessous.`);
      } else {
        this.toastService.error('Aucune image trouvée pour cette recherche');
      }

    } catch (error: any) {
      console.error('Erreur recherche images:', error);
      this.toastService.error(`Erreur: ${error.message || 'Échec de la recherche d\'images'}`);
    } finally {
      this.isSearchingImages = false;
    }
  }

  onNameClick(parfum: any, event: Event) {
    event.stopPropagation(); // Empêche la sélection standard de la ligne si nécessaire
    this.selectParfum(parfum); // Sélectionne le parfum pour remplir le formulaire
    this.autoFillImages(); // Lance la recherche d'images
  }

  selectImageFor(url: string, type: 'principale' | 'secondaire') {
    if (type === 'principale') {
      this.selectedParfum.url_image_principale = url;
    } else {
      this.selectedParfum.url_image_secondaire = url;
    }
    this.toastService.success(`Image ${type} mise à jour`);
  }

  // Helpers pour l'affichage
  getMarqueName(id: number): string {
    const m = this.marques.find(x => x.id_marque === id);
    return m ? m.nom_marque : 'Inconnue';
  }

  getFamilleName(id: number): string {
    const f = this.familles.find(x => x.id_famille === id);
    return f ? f.nom_famille : '-';
  }

  get paginatedParfums() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.parfums.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.parfums.length / this.itemsPerPage) || 1;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  downloadCSV() {
    if (!this.parfums || this.parfums.length === 0) {
      this.toastService.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['ID', 'Nom', 'Marque', 'Famille', 'Genre', 'Volume (ml)', 'Prix Achat', 'Prix Vente', 'Stock'];
    
    const csvRows = this.parfums.map(p => {
      return [
        p.id_parfum,
        `"${(p.nom_parfum || '').replace(/"/g, '""')}"`,
        `"${this.getMarqueName(p.id_marque).replace(/"/g, '""')}"`,
        `"${this.getFamilleName(p.id_famille).replace(/"/g, '""')}"`,
        p.genre,
        p.volume_ml,
        p.prix_achat,
        p.prix_vente,
        p.stock_actuel
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parfums_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}