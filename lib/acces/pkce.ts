/**
 * PKCE — RFC 7636, la preuve qui remplace le secret client.
 *
 * L'application est distribuée : son `client_id` part avec elle, et un secret
 * qui part avec le produit n'est pas un secret. PKCE règle ça sans rien cacher.
 * À chaque tentative de connexion, un vérifieur tiré au hasard reste sur la
 * machine ; seul son empreinte — le défi — voyage. Le code d'autorisation
 * intercepté ne vaut alors rien : il ne s'échange qu'avec le vérifieur.
 */

import { createHash, randomBytes } from "node:crypto";

/** 32 octets font 43 caractères en base64url, le minimum de la RFC. */
const OCTETS = 32;

export interface Defi {
  /** Ne quitte jamais la machine. */
  verifieur: string;
  /** L'empreinte, seule à voyager. */
  defi: string;
  methode: "S256";
}

/** L'empreinte du vérifieur. `base64url` ne remplit pas : le remplissage casserait la comparaison. */
export function defiDepuis(verifieur: string): string {
  return createHash("sha256").update(verifieur).digest("base64url");
}

export function fabriquerDefi(): Defi {
  const verifieur = randomBytes(OCTETS).toString("base64url");
  return { verifieur, defi: defiDepuis(verifieur), methode: "S256" };
}
