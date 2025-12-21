import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { BoutiqueItem } from '../../models/boutique.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './boutique.component.html',
  styleUrls: ['./boutique.component.css']
})
export class BoutiqueComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  boutiqueForm: FormGroup;
  products$ = this.supabase.products$;
  items: any[] = [];
  filteredItems: any[] = []; // Liste affichée après filtrage

  // États des filtres
  searchTerm: string = '';
  filterBrand: string = '';
  filterCategory: string = '';
  uniqueBrands: string[] = [];
  uniqueCategories: string[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  editingItemId: string | null = null;
  showForm = false;
  uploading = false;
  uploadProgress = 0;
  uploadedImageUrl: string | null = null;

  constructor() {
    this.boutiqueForm = this.fb.group({
      title: ['', Validators.required],
      brand: [''],
      category: ['Eau de Parfum'],
      gender: ['Unisexe'],
      olfactory_family: [''],
      volume_ml: [50],
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      video_url: [''],
      product_id: [null],
      is_active: [true],
      is_featured: [false]
    });
  }

  ngOnInit() {
    this.loadItems();
    this.supabase.loadProducts();
  }

  async loadItems() {
    try {
      this.items = await this.supabase.getBoutiqueItems(false) || [];
      
      // Extraction dynamique des marques et catégories présentes pour les listes déroulantes
      this.uniqueBrands = [...new Set(this.items.map(i => i.brand).filter(b => !!b))].sort();
      this.uniqueCategories = [...new Set(this.items.map(i => i.category).filter(c => !!c))].sort();
      
      this.applyFilters(); // Initialisation de la liste filtrée
    } catch (error) {
      console.error(error);
    }
  }

  applyFilters() {
    this.filteredItems = this.items.filter(item => {
      const matchesSearch = !this.searchTerm || 
        (item.title && item.title.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesBrand = !this.filterBrand || item.brand === this.filterBrand;
      
      const matchesCategory = !this.filterCategory || item.category === this.filterCategory;

      return matchesSearch && matchesBrand && matchesCategory;
    });
    this.currentPage = 1; // Revenir à la première page après un filtre
  }

  get paginatedItems(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredItems.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  toggleForm() {
    if (this.showForm) {
      // Si le formulaire est ouvert (en mode création ou édition), le bouton "Fermer" le ferme et réinitialise l'état.
      this.cancelEdit();
    } else {
      // Si le formulaire est fermé, le bouton "Ajouter" l'ouvre en mode création.
      this.resetFormAndState();
      this.showForm = true;
    }
  }

  editItem(item: BoutiqueItem) {
    this.editingItemId = item.id!;
    this.boutiqueForm.patchValue(item);
    this.uploadedImageUrl = item.image_url || null;
    this.showForm = true;
    window.scrollTo(0, 0); // Fait défiler vers le haut pour voir le formulaire
  }

  cancelEdit() {
    this.showForm = false;
    this.resetFormAndState();
  }

  private resetFormAndState() {
    this.editingItemId = null;
    this.uploadedImageUrl = null;
    this.boutiqueForm.reset({
      category: 'Eau de Parfum',
      gender: 'Unisexe',
      volume_ml: 50,
      price: 0,
      is_active: true, is_featured: false, product_id: null
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validation type (JPG/PNG uniquement)
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      this.toast.error("Format non supporté. Veuillez utiliser JPG ou PNG.");
      return;
    }

    // Validation taille (Max 10MB avant compression)
    if (file.size > 10 * 1024 * 1024) {
      this.toast.error("L'image est trop volumineuse (Max 10MB)");
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    try {
      // Compression de l'image côté client
      const compressedFile = await this.compressImage(file);

      const fileExt = 'jpg'; // La compression sort toujours du JPEG
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const path = `boutique/${fileName}`;
      
      this.uploadedImageUrl = await this.supabase.uploadProductImage(compressedFile, path, (progress) => {
        this.uploadProgress = progress;
      });
      this.toast.success('Image téléchargée avec succès');
    } catch (error: any) {
      console.error(`Erreur upload (Status: ${error.statusCode}):`, error);
      if (error.message === 'Bucket not found' || (error.error && error.error === 'Bucket not found')) {
        this.toast.error(`Erreur config: Le bucket '${environment.storageBucket}' n'existe pas dans Supabase.`);
      } else if (error.statusCode == 500 || error.statusCode == 403 || error.message?.includes('policy')) {
        this.toast.error("Erreur de permission (403/500). Vérifiez les policies du bucket de stockage.");
      } else {
        this.toast.error(`Erreur upload: ${error.message || 'Inconnue'}`);
      }
    } finally {
      this.uploading = false;
    }
  }

  private compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Largeur max pour la boutique (HD)
          
          let width = img.width;
          let height = img.height;

          // Redimensionnement proportionnel
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Conversion en JPEG qualité 80%
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else reject(new Error('Erreur compression'));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  removeImage() {
    this.uploadedImageUrl = null;
  }

  async onSubmit() {
    if (this.boutiqueForm.invalid) return;

    const formData = this.boutiqueForm.value;
    const newItem: Partial<BoutiqueItem> = {
      ...formData,
      image_url: this.uploadedImageUrl
    };

    try {
      if (this.editingItemId) {
        // Mode mise à jour
        await this.supabase.updateBoutiqueItem(this.editingItemId, newItem);
        this.toast.success('Article mis à jour avec succès !');
      } else {
        // Mode création
        await this.supabase.createBoutiqueItem(newItem);
        this.toast.success('Article ajouté à la boutique !');
      }

      this.cancelEdit();
      await this.loadItems();
    } catch (error) {
      console.error(error);
      this.toast.error("Erreur lors de l'enregistrement de l'article");
    }
  }

  async deleteItem(item: BoutiqueItem) {
    if (!item.id) return;

    const confirmation = window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${item.title}" ? Cette action est irréversible.`);

    if (confirmation) {
      try {
        await this.supabase.deleteBoutiqueItem(item.id, item.image_url);
        this.toast.success('Article supprimé avec succès.');

        // Si l'élément supprimé était en cours d'édition, on ferme et réinitialise le formulaire
        if (this.editingItemId === item.id) {
          this.cancelEdit();
        }

        await this.loadItems(); // Recharger la liste
      } catch (error) {
        this.toast.error("Erreur lors de la suppression de l'article.");
      }
    }
  }

  onImageError(event: any) {
    event.target.src = 'assets/placeholder-perfume.jpg';
    event.target.onerror = null; // Empêche une boucle infinie si le placeholder n'existe pas
  }
}