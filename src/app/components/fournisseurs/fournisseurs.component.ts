import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { RpcService } from '../../services/rpc.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './fournisseurs.component.html',
  styleUrl: './fournisseurs.component.css'
})
export class FournisseursComponent implements OnInit {
  fournisseurs$: Observable<Fournisseur[]>;
  fournisseurForm: FormGroup;

  constructor(
    private supabaseService: SupabaseService,
    private rpcService: RpcService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.fournisseurs$ = this.supabaseService.fournisseurs$;
    this.fournisseurForm = this.fb.group({
      nom_societe: ['', Validators.required],
      nom_contact: [''],
      email: ['', [Validators.email]],
      telephone: [''],
      adresse: [''],
      delai_livraison_moyen_jours: [7]
    });
  }

  ngOnInit() {
    this.supabaseService.loadFournisseurs();
  }

  async onSubmit() {
    if (this.fournisseurForm.valid) {
      try {
        // Nettoyage : transformer les chaînes vides "" en null pour éviter les erreurs SQL
        const formValue = this.fournisseurForm.value;
        const cleanData = Object.keys(formValue).reduce((acc: any, key) => {
          acc[key] = formValue[key] === '' ? null : formValue[key];
          return acc;
        }, {});

        await this.rpcService.upsertFournisseur(
          null, // ID null = Création (INSERT)
          cleanData.nom_societe,
          cleanData.nom_contact,
          cleanData.email,
          cleanData.telephone,
          cleanData.adresse,
          cleanData.delai_livraison_moyen_jours
        );
        
        this.toastService.success('Fournisseur enregistré avec succès !');
        this.fournisseurForm.reset({ delai_livraison_moyen_jours: 7 });
        this.supabaseService.loadFournisseurs(); // Recharger la liste
      } catch (error) {
        console.warn(error);
        console.error('Erreur lors de l\'ajout:', error);
        this.toastService.error("Erreur lors de l'enregistrement du fournisseur.");
      }
    } else {
      console.warn('Formulaire invalide', this.fournisseurForm.errors);
      this.toastService.error('Veuillez remplir les champs obligatoires (Nom de la société).');
    }
  }

  async onDelete(id: string | number | undefined) {
    if (id && confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) {
      await this.supabaseService.deleteFournisseur(String(id));
    }
  }
}
