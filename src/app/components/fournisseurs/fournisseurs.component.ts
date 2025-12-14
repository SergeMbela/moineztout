import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
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
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.fournisseurs$ = this.supabaseService.fournisseurs$;
    this.fournisseurForm = this.fb.group({
      name: ['', Validators.required],
      contact_email: ['', [Validators.email]],
      phone_number: [''],
      tva: [''],
      adresse: [''],
      ville: [''],
      code_postal: ['']
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

        await this.supabaseService.addFournisseur(cleanData);
        this.toastService.success('Fournisseur ajouté avec succès !');
        this.fournisseurForm.reset();
      } catch (error) {
        console.warn(error);
        console.error('Erreur lors de l\'ajout:', error);
        this.toastService.error("Erreur lors de l'enregistrement du fournisseur.");
      }
    } else {
      console.warn('Formulaire invalide', this.fournisseurForm.errors);
      this.toastService.error('Veuillez remplir les champs obligatoires (Nom).');
    }
  }

  async onDelete(id: string | number | undefined) {
    if (id && confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) {
      await this.supabaseService.deleteFournisseur(String(id));
    }
  }
}
