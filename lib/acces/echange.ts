/**
 * L'échange du code contre des jetons.
 *
 * La réponse vient du réseau, donc rien n'y est supposé : elle peut être
 * tronquée, malformée, ou porter un refus là où on attend un succès. La lecture
 * est séparée de l'appel pour qu'elle soit démontrable sans joindre Clerk.
 */

import { adresseJeton, corpsEchange, corpsRafraichissement, type Fournisseur } from "./oauth.ts";

/** Faute de durée exploitable, une heure — la valeur usuelle d'un jeton d'accès. */
const DUREE_PAR_DEFAUT = 3600;

export interface Jetons {
  acces: string;
  /** `null` si le fournisseur a refusé `offline_access`. Ce n'est pas bloquant. */
  rafraichissement: string | null;
  expireDans: number;
}

export function lireJetons(charge: unknown): Jetons | null {
  if (!charge || typeof charge !== "object" || Array.isArray(charge)) return null;

  const corps = charge as Record<string, unknown>;
  if (typeof corps.access_token !== "string" || !corps.access_token) return null;

  const duree = corps.expires_in;
  return {
    acces: corps.access_token,
    rafraichissement: typeof corps.refresh_token === "string" ? corps.refresh_token : null,
    expireDans: typeof duree === "number" && duree > 0 ? duree : DUREE_PAR_DEFAUT,
  };
}

/**
 * Les jetons, ou `null` si l'échange n'aboutit pas.
 *
 * Ne lève jamais : une panne réseau au retour doit se lire comme un message,
 * pas comme une page d'erreur du framework.
 */
export async function echanger(
  f: Fournisseur,
  { code, verifieur }: { code: string; verifieur: string },
): Promise<Jetons | null> {
  try {
    const reponse = await fetch(adresseJeton(f), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpsEchange(f, { code, verifieur }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return lireJetons(await reponse.json());
  } catch {
    return null;
  }
}

/**
 * Un jeton d'accès frais à partir du jeton de rafraîchissement.
 *
 * `null` en cas d'échec, et ce n'est jamais fatal : le droit d'écrire a été
 * établi une fois pour toutes, il n'est pas maintenu par ce jeton. Un
 * rafraîchissement qui échoue veut dire « pas de nouvelle du service », pas
 * « accès retiré ».
 */
export async function rafraichir(f: Fournisseur, jeton: string): Promise<Jetons | null> {
  try {
    const reponse = await fetch(adresseJeton(f), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpsRafraichissement(f, { jeton }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return lireJetons(await reponse.json());
  } catch {
    return null;
  }
}
