/**
 * Le lien entre un compte et son client Stripe.
 *
 * Toujours pas de table : Stripe reste la source de vérité du paiement, et le
 * lien vit dans les métadonnées du client. En tenir une seconde copie, ce
 * serait fabriquer deux vérités qui divergeront.
 *
 * La contrepartie est que la recherche prend une requête **textuelle**. Un
 * identifiant de compte y est donc échappé, jamais concaténé tel quel.
 */

import type Stripe from "stripe";
import { stripe } from "../licence/stripe.ts";

/** La métadonnée qui porte l'identifiant du compte, côté client Stripe. */
export const CHAMP_COMPTE = "compte_orcha";

/** La requête de recherche, ou `null` si le compte n'est pas nommable. */
export function requeteDuCompte(compte: string): string | null {
  const propre = compte.trim();
  if (!propre) return null;

  // Une apostrophe non échappée terminerait la clause et en ouvrirait une autre.
  return `metadata['${CHAMP_COMPTE}']:'${propre.replace(/['\\]/g, (c) => `\\${c}`)}'`;
}

/** Le premier client du résultat, ou `null`. Ne lève jamais : la charge vient du réseau. */
export function clientDuResultat(resultat: unknown): string | null {
  if (!resultat || typeof resultat !== "object") return null;

  const data = (resultat as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) return null;

  const premier = data[0] as { id?: unknown };
  return typeof premier?.id === "string" ? premier.id : null;
}

/** Le client Stripe déjà rattaché à ce compte, s'il existe. */
export async function clientDuCompte(compte: string): Promise<string | null> {
  const query = requeteDuCompte(compte);
  if (!query) return null;

  return clientDuResultat(await stripe().customers.search({ query, limit: 2 }));
}

/**
 * Le client Stripe de ce compte, créé au besoin.
 *
 * Appelé à l'ouverture du paiement : c'est là, et seulement là, que le lien se
 * noue. Sans lui, aucune question sur le droit d'écrire n'aurait de réponse.
 */
export async function rattacherClient(compte: string, courriel?: string): Promise<string> {
  const existant = await clientDuCompte(compte);
  if (existant) return existant;

  const cree: Stripe.Customer = await stripe().customers.create({
    email: courriel,
    metadata: { [CHAMP_COMPTE]: compte },
  });
  return cree.id;
}
