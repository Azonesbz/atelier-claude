/**
 * Le parcours d'autorisation : ouvrir la connexion, puis juger le retour.
 *
 * Le retour est la seule surface de ce mécanisme qu'un tiers puisse atteindre.
 * Elle vit sur une machine où aucune action n'est authentifiée, donc tout ce
 * qui en vient est traité comme hostile : sans état gardé et identique, il ne
 * se passe rien.
 */

import { randomBytes } from "node:crypto";
import { adresseAutorisation, type Fournisseur } from "./oauth.ts";
import { fabriquerDefi } from "./pkce.ts";

/** 16 octets font 22 caractères en base64url — assez pour ne pas se deviner. */
const OCTETS_ETAT = 16;

export interface Depart {
  /** Là où envoyer l'acheteur. */
  adresse: string;
  /** À garder sur la machine jusqu'au retour, et à ne jamais envoyer. */
  verifieur: string;
  /** À garder aussi : c'est lui qui prouve que le retour est le nôtre. */
  etat: string;
}

export type Retour = { code: string } | { erreur: string };

export function demarrer(f: Fournisseur): Depart {
  const { verifieur, defi } = fabriquerDefi();
  const etat = randomBytes(OCTETS_ETAT).toString("base64url");
  return { adresse: adresseAutorisation(f, { defi, etat }), verifieur, etat };
}

/**
 * Le code d'autorisation, ou la raison du refus.
 *
 * L'ordre compte : on compare l'état avant de regarder quoi que ce soit
 * d'autre. Un état vide ne correspond jamais — sinon un retour fabriqué de
 * toutes pièces, arrivant sans cookie, vaudrait un succès.
 */
export function validerRetour(params: URLSearchParams, attendu: { etat: string }): Retour {
  if (!attendu.etat) return { erreur: "Aucune connexion en cours sur cette machine." };
  if (params.get("state") !== attendu.etat) {
    return { erreur: "Ce retour ne correspond à aucune connexion ouverte ici." };
  }

  const refus = params.get("error");
  if (refus) return { erreur: `Le fournisseur a refusé la connexion (${refus}).` };

  const code = params.get("code");
  if (!code) return { erreur: "Le fournisseur n'a rendu aucun code d'autorisation." };

  return { code };
}
