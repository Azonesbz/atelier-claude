/**
 * Qui vient de se connecter.
 *
 * Le strict nécessaire pour nommer la personne dans l'interface et pour que le
 * service sache à quel compte rattacher un paiement. Rien d'autre n'est lu, et
 * rien n'est stocké ailleurs que dans le fichier de session local.
 */

import type { Fournisseur } from "./oauth.ts";

export interface Compte {
  id: string;
  courriel: string | null;
}

export function lireCompte(charge: unknown): Compte | null {
  if (!charge || typeof charge !== "object" || Array.isArray(charge)) return null;

  const corps = charge as Record<string, unknown>;
  // `sub` est l'identifiant stable du standard OIDC ; `user_id` est l'alias Clerk.
  const id = [corps.sub, corps.user_id].find((v) => typeof v === "string" && v);
  if (typeof id !== "string") return null;

  const courriel = corps.email;
  return { id, courriel: typeof courriel === "string" && courriel ? courriel : null };
}

/** Le compte, ou `null` : une identité qu'on ne peut pas lire n'ouvre rien. */
export async function interrogerCompte(f: Fournisseur, acces: string): Promise<Compte | null> {
  try {
    const reponse = await fetch(`${f.emetteur}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${acces}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return lireCompte(await reponse.json());
  } catch {
    return null;
  }
}
