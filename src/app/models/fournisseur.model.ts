export interface Fournisseur {
  id_fournisseur?: number;
  nom_societe: string;
  nom_contact?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  delai_livraison_moyen_jours?: number | null;
  created_at?: string;
}