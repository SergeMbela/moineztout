import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class RpcService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase(): SupabaseClient {
    return this.supabaseService.client;
  }

  /**
   * Méthode générique pour exécuter les appels RPC.
   * Centralise la gestion des erreurs et le retour de données.
   */
  private async callRpc<T>(functionName: string, params: any): Promise<T> {
    const { data, error } = await this.supabase.rpc(functionName, params);
    if (error) {
      console.error(`[RPC Error] ${functionName}:`, error);
      throw error;
    }
    return data as T;
  }

  async upsertMarque(id: number | null, nom: string, pays: string): Promise<number> {
    return this.callRpc<number>('mo_upsert_marque', {
      p_id_marque: id,
      p_nom_marque: nom,
      p_pays_origine: pays
    });
  }

  async upsertFamilleOlfactive(id: number | null, nom: string, description: string): Promise<number> {
    return this.callRpc<number>('mo_upsert_famille_olfactive', {
      p_id_famille: id,
      p_nom_famille: nom,
      p_description: description
    });
  }

  async upsertModeLivraison(id: number | null, nom: string, transporter: string, delai: number, cout: number): Promise<number> {
    return this.callRpc<number>('mo_upsert_mode_livraison', {
      p_id_mode: id,
      p_nom_mode: nom,
      p_transporter: transporter,
      p_delai_estime: delai,
      p_cout_standard: cout
    });
  }

  async upsertParfum(
    id: number | null,
    nom: string,
    idMarque: number | null,
    idFamille: number | null,
    idFournisseur: number | null,
    idTypeConditionnement: number | null,
    genre: string | null,
    volume: number,
    prixAchat: number,
    prixVente: number,
    stock: number,
    seuilAlerte: number,
    urlImagePrincipale: string | null,
    urlImageSecondaire: string | null,
    urlVideoYoutube: string | null
  ): Promise<void> {
    return this.callRpc<void>('mo_upsert_parfum', {
      p_id_parfum: id,
      p_nom_parfum: nom,
      p_id_marque: idMarque,
      p_id_famille: idFamille,
      p_id_fournisseur_prefere: idFournisseur,
      p_id_type_conditionnement: idTypeConditionnement,
      p_genre: genre || null,
      p_volume_ml: volume,
      p_prix_achat: prixAchat,
      p_prix_vente: prixVente,
      p_stock_actuel: stock,
      p_seuil_alerte: seuilAlerte,
      p_url_image_principale: urlImagePrincipale || null,
      p_url_image_secondaire: urlImageSecondaire || null,
      p_url_video_youtube: urlVideoYoutube || null
    });
  }

  async upsertClient(
    id: number | null,
    nom: string,
    prenom: string,
    email: string,
    adresse: string,
    telephone: string
  ): Promise<number> {
    return this.callRpc<number>('mo_upsert_client', {
      p_id_client: id,
      p_nom: nom,
      p_prenom: prenom,
      p_email: email,
      p_adresse_defaut: adresse,
      p_telephone: telephone
    });
  }

  async upsertCommandeClient(
    idCmd: number | null,
    idClient: number,
    idModeLivraison: number,
    statut: string,
    adresse: string,
    fraisPort: number,
    numSuivi: string,
    dateExpedition: Date | string | null
  ): Promise<number> {
    return this.callRpc<number>('mo_upsert_commande_client', {
      p_id_cmd_client: idCmd,
      p_id_client: idClient,
      p_id_mode_livraison: idModeLivraison,
      p_statut: statut,
      p_adresse_livraison: adresse,
      p_frais_port: fraisPort,
      p_numero_suivi: numSuivi,
      p_date_expedition: dateExpedition
    });
  }

  async upsertLigneVente(idLigne: number | null, idCmd: number, idParfum: number, quantite: number, prixUnit: number): Promise<number> {
    return this.callRpc<number>('mo_upsert_ligne_vente', {
      p_id_ligne: idLigne,
      p_id_cmd: idCmd,
      p_id_parfum: idParfum,
      p_quantite: quantite,
      p_prix_unit: prixUnit
    });
  }

  async upsertTypeConditionnement(id: number | null, nom: string, description: string): Promise<number> {
    return this.callRpc<number>('mo_upsert_type_conditionnement', {
      p_id_type: id,
      p_nom_type: nom,
      p_description: description
    });
  }

  async upsertCommandeFournisseur(idCmd: number | null, idFournisseur: number, statut: string): Promise<number> {
    return this.callRpc<number>('mo_upsert_commande_fournisseur', {
      p_id_cmd_fourn: idCmd,
      p_id_fournisseur: idFournisseur,
      p_statut: statut
    });
  }

  async upsertLigneAchat(
    idLigne: number | null,
    idCmdFourn: number,
    idParfum: number,
    qtyCommandee: number,
    qtyRecue: number,
    prixAchatUnit: number
  ): Promise<number> {
    return this.callRpc<number>('mo_upsert_ligne_achat', {
      p_id_ligne: idLigne,
      p_id_cmd_fourn: idCmdFourn,
      p_id_parfum: idParfum,
      p_qty_commandee: qtyCommandee,
      p_qty_recue: qtyRecue,
      p_prix_achat_uni: prixAchatUnit
    });
  }

  async upsertMouvementStock(
    idMvt: number | null,
    idParfum: number,
    typeMvt: string,
    quantite: number,
    refDoc: string
  ): Promise<number> {
    return this.callRpc<number>('mo_upsert_mouvement_stock', {
      p_id_mouvement: idMvt,
      p_id_parfum: idParfum,
      p_type_mvt: typeMvt,
      p_quantite: quantite,
      p_ref_document: refDoc
    });
  }

  async upsertFournisseur(
    id: number | null,
    nomSociete: string,
    nomContact: string | null,
    email: string | null,
    telephone: string | null,
    adresse: string | null,
    delai: number | null
  ): Promise<number> {
    return this.callRpc<number>('mo_upsert_fournisseur', {
      p_id_fournisseur: id,
      p_nom_societe: nomSociete,
      p_nom_contact: nomContact,
      p_email: email,
      p_telephone: telephone,
      p_adresse: adresse,
      p_delai_livraison_moyen_jours: delai
    });
  }
}
