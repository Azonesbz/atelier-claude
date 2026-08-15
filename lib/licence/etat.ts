/**
 * L'état de la licence, côté application locale.
 *
 * La clé vit dans un fichier à côté de l'application, comme le choix de
 * projet. La vérification interroge le service, puis se met en cache : sans
 * cache, chaque rendu de page ferait un aller-retour réseau, et la moindre
 * coupure rendrait l'outil inutilisable.
 *
 * L'achat est unique et la licence perpétuelle : une fois vérifiée, elle ne
 * périme jamais. Le service n'est rappelé que de loin en loin, pour attraper un
 * remboursement — et une panne réseau ne referme jamais l'écriture de quelqu'un
 * qui a payé.
 */

import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { adresseDuService } from "./stripe.ts";

const FICHIER = ".atelier-licence.json";
/** Une licence vérifiée est repointée de loin en loin, pour attraper un
    remboursement. Entre deux, le cache fait foi — et hors ligne, indéfiniment. */
const DUREE_DU_CACHE = 30 * 24 * 60 * 60 * 1000;

export interface Licence {
  cle: string;
  /** Dernière réponse du service, et sa date. */
  valide: boolean;
  /** Date d'achat, telle que le service la rapporte. */
  jusquau: string | null;
  raison?: string;
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
    const corps = (await reponse.json()) as {
      valide?: boolean | null;
      "achetéLe"?: string | null;
      raison?: string | null;
    };
    // `valide: null` veut dire « service indisponible » : on ne touche pas au
    // cache, sinon une panne de Stripe retirerait la licence d'un acheteur.
    if (corps.valide === null || corps.valide === undefined) return depuisCache(licence);

    const frais: Licence = {
      cle: licence.cle,
      valide: corps.valide === true,
      jusquau: corps["achetéLe"] ?? null,
      raison: corps.raison ?? undefined,
      verifieLe: Date.now(),
    };
    ecrireFichier(frais);
    return depuisCache(frais);
  } catch {
    return depuisCache(licence);
  }
}

/**
 * Une licence déjà validée le reste.
 *
 * C'est la conséquence directe d'un achat unique : rien n'expire, donc rien ne
 * doit se refermer parce qu'un serveur n'a pas répondu. Seul le service, joint
 * et catégorique, peut retirer une licence — un remboursement.
 */
function depuisCache(licence: Licence): EtatLicence {
  if (licence.valide) return { etat: "active", jusquau: licence.jusquau, cle: licence.cle };

  return {
    etat: "refusee",
    raison:
      licence.verifieLe === 0
        ? "Cette clé n'a pas encore pu être vérifiée auprès du service."
        : (licence.raison ?? "Aucun paiement trouvé pour cette clé."),
    cle: licence.cle,
  };
}

/** Le seul appel dont l'interface a besoin : l'écriture est-elle ouverte ? */
export async function ecritureOuverte(): Promise<boolean> {
  const etat = await etatDeLaLicence();
  return etat.etat === "active" || etat.etat === "hors-ligne";
}
