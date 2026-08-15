/**
 * La clé de licence : un identifiant client Stripe, signé.
 *
 * Pas de base de données, pas de table d'utilisateurs, pas de session. Ce que
 * l'outil doit savoir tient en une question — « cet abonnement est-il actif ? »
 * — et Stripe la porte déjà. La clé n'est donc qu'un identifiant client rendu
 * infalsifiable par une signature : sans le secret, on ne peut ni en fabriquer
 * une, ni transformer la sienne en celle d'un autre.
 *
 * Elle ne prouve rien à elle seule. C'est le service qui interroge Stripe.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const PREFIXE = "AC";
const LONGUEUR_SIGNATURE = 10;

export class LicenceInvalide extends Error {}

/** Le secret de signature, seulement côté service. Absent en local, et c'est normal. */
function secret(): string {
  const valeur = process.env.ATELIER_LICENCE_SECRET;
  if (!valeur || valeur.length < 24) {
    throw new LicenceInvalide(
      "ATELIER_LICENCE_SECRET est absent ou trop court (24 caractères au minimum).",
    );
  }
  return valeur;
}

function signer(charge: string): string {
  return createHmac("sha256", secret()).update(charge).digest("base64url").slice(0, LONGUEUR_SIGNATURE);
}

/** `AC-<client encodé>-<signature>`. Lisible, sélectionnable d'un double-clic. */
export function fabriquerCle(identifiantClient: string): string {
  if (!identifiantClient.startsWith("cus_")) {
    throw new LicenceInvalide("Un identifiant client Stripe commence par « cus_ ».");
  }
  const charge = Buffer.from(identifiantClient, "utf8").toString("base64url");
  return `${PREFIXE}-${charge}-${signer(charge)}`;
}

/**
 * Rend l'identifiant client si la signature tient, sinon null.
 *
 * La comparaison est à temps constant : une comparaison naïve laisserait
 * deviner la signature octet par octet.
 */
export function clientDeLaCle(cle: string): string | null {
  const morceaux = cle.trim().split("-");
  if (morceaux.length !== 3 || morceaux[0] !== PREFIXE) return null;

  const [, charge, signature] = morceaux;
  let attendue: string;
  try {
    attendue = signer(charge);
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(attendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const client = Buffer.from(charge, "base64url").toString("utf8");
  return client.startsWith("cus_") ? client : null;
}
