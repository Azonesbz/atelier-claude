/**
 * L'état de la licence, côté application locale.
 *
 * La clé vit dans un fichier à côté de l'application, comme le choix de
 * projet. La vérification interroge le service, puis se met en cache : sans
 * cache, chaque rendu de page ferait un aller-retour réseau, et la moindre
 * coupure rendrait l'outil inutilisable.
 *
 * Le cache est volontairement long et tolérant. Couper l'écriture parce que le
 * wifi est tombé serait une punition absurde pour quelqu'un qui a payé.
 */

import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { adresseDuService } from "./stripe.ts";

const FICHIER = ".atelier-licence.json";
/** Au-delà, on redemande au service. En dessous, on fait confiance au cache. */
const DUREE_DU_CACHE = 12 * 60 * 60 * 1000;
/** Un service injoignable ne coupe pas l'écriture avant ce délai. */
const TOLERANCE_HORS_LIGNE = 14 * 24 * 60 * 60 * 1000;

export interface Licence {
  cle: string;
  /** Dernière réponse du service, et sa date. */
  valide: boolean;
  jusquau: string | null;
  verifieLe: number;
}

export type EtatLicence =
  | { etat: "absente" }
  | { etat: "active"; jusquau: string | null; cle: string }
  | { etat: "refusee"; raison: string; cle: string }
  | { etat: "hors-ligne"; depuis: string; cle: string };

function chemin(): string {
  return join(process.cwd(), FICHIER);
}

function lireFichier(): Licence | null {
  try {
    const valeur = JSON.parse(readFileSync(chemin(), "utf8")) as Partial<Licence>;
    return typeof valeur.cle === "string" && valeur.cle ? (valeur as Licence) : null;
  } catch {
    return null;
  }
}

function ecrireFichier(licence: Licence): void {
  const provisoire = `${chemin()}.${process.pid}`;
  writeFileSync(provisoire, `${JSON.stringify(licence, null, 2)}\n`, "utf8");
  renameSync(provisoire, chemin());
}

export function retirerLicence(): void {
  try {
    unlinkSync(chemin());
  } catch {
    // Pas de licence enregistrée : rien à retirer.
  }
}

export function enregistrerCle(cle: string): void {
  ecrireFichier({ cle: cle.trim(), valide: false, jusquau: null, verifieLe: 0 });
}

/**
 * L'état courant, en interrogeant le service au plus une fois par demi-journée.
 *
 * Ne lève jamais : une panne du service ne doit pas empêcher de LIRE son
 * dossier .claude, qui est gratuit de toute façon.
 */
export async function etatDeLaLicence(): Promise<EtatLicence> {
  const licence = lireFichier();
  if (!licence) return { etat: "absente" };

  const age = Date.now() - licence.verifieLe;
  if (age < DUREE_DU_CACHE) return depuisCache(licence);

  const service = adresseDuService();
  if (!service) return depuisCache(licence);

  try {
    const reponse = await fetch(`${service}/api/licence?cle=${encodeURIComponent(licence.cle)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const corps = (await reponse.json()) as { valide?: boolean; jusquau?: string | null };
    const frais: Licence = {
      cle: licence.cle,
      valide: corps.valide === true,
      jusquau: corps.jusquau ?? null,
      verifieLe: Date.now(),
    };
    ecrireFichier(frais);
    return depuisCache(frais);
  } catch {
    return depuisCache(licence);
  }
}

function depuisCache(licence: Licence): EtatLicence {
  if (licence.valide) return { etat: "active", jusquau: licence.jusquau, cle: licence.cle };

  const jamaisVerifiee = licence.verifieLe === 0;
  const perimee = Date.now() - licence.verifieLe > TOLERANCE_HORS_LIGNE;

  if (jamaisVerifiee || perimee) {
    return {
      etat: "refusee",
      raison: jamaisVerifiee
        ? "Cette clé n'a pas encore pu être vérifiée auprès du service."
        : "Aucun abonnement actif pour cette clé.",
      cle: licence.cle,
    };
  }
  return { etat: "hors-ligne", depuis: new Date(licence.verifieLe).toISOString(), cle: licence.cle };
}

/** Le seul appel dont l'interface a besoin : l'écriture est-elle ouverte ? */
export async function ecritureOuverte(): Promise<boolean> {
  const etat = await etatDeLaLicence();
  return etat.etat === "active" || etat.etat === "hors-ligne";
}
