/**
 * Le droit d'écrire, tranché sans réseau ni disque.
 *
 * Toute la subtilité du produit tient ici, et elle vient du modèle de vente :
 * l'achat est unique, la licence perpétuelle. Donc **rien ne se referme sur
 * quelqu'un dont le paiement a déjà été constaté**, sauf le service joint et
 * catégorique — un remboursement. Un jeton expiré, un service en panne, un
 * avion : aucun n'est un refus, seulement une absence de nouvelle.
 *
 * C'est ce qui distingue ce mécanisme d'une session ordinaire. Le jeton
 * **établit** le droit ; il ne le **maintient** pas.
 */

/** Une licence vérifiée est repointée de loin en loin, pour attraper un remboursement. */
export const DUREE_DU_CACHE = 30 * 24 * 60 * 60 * 1000;

/** Ce que la machine garde du dernier verdict. */
export interface Cache {
  droit: boolean;
  verifieLe: number;
}

/** La réponse du service, ou `null` quand il n'a rien dit — panne, hors ligne, jeton mort. */
export type Reponse = { droit: true } | { droit: false; raison: string } | null;

export type EtatAcces =
  | { etat: "deconnecte" }
  | { etat: "ouverte" }
  | { etat: "refusee"; raison: string };

const JAMAIS_VERIFIE = "Aucun achat n'a encore pu être vérifié pour ce compte.";

export function tranche(cache: Cache | null, reponse: Reponse): EtatAcces {
  if (!cache) return { etat: "deconnecte" };

  // Le service a parlé : il fait foi, dans les deux sens.
  if (reponse) {
    return reponse.droit ? { etat: "ouverte" } : { etat: "refusee", raison: reponse.raison };
  }

  // Personne n'a rien dit : le dernier verdict tient.
  return cache.droit ? { etat: "ouverte" } : { etat: "refusee", raison: JAMAIS_VERIFIE };
}

/**
 * Faut-il rappeler le service ?
 *
 * Une date postérieure à l'instant présent est traitée comme périmée : horloge
 * reculée ou fichier bricolé, sans cette borne le cache ne périmerait plus.
 */
export function doitReverifier(cache: Cache, maintenant: number): boolean {
  if (!cache.droit) return true;

  const age = maintenant - cache.verifieLe;
  return age < 0 || age >= DUREE_DU_CACHE;
}
