/**
 * Les requêtes du flux d'autorisation, et rien d'autre.
 *
 * Aucun appel réseau ne part d'ici : ces fonctions fabriquent une adresse et un
 * corps de requête. Le réseau se branche au-dessus, ce qui rend le protocole
 * démontrable sans joindre Clerk.
 *
 * Clerk s'expose ici comme simple fournisseur OIDC — pas via son SDK Next.js.
 * C'est délibéré : son motif habituel repose sur un cookie posé sur le domaine
 * du service, et l'application locale vit sur `127.0.0.1`, une autre origine.
 * Le cookie ne traverserait pas. Le flux d'autorisation, lui, traverse.
 *
 * L'autre raison est plus dirimante encore : le SDK backend réclame
 * `CLERK_SECRET_KEY`, qui ouvre la Backend API — lister les comptes, les
 * supprimer, forger des sessions. Elle ne peut pas partir sur la machine d'un
 * acheteur. Le rôle local ne connaît donc que des valeurs publiques.
 */

import { emetteurDepuisClePubliable } from "./emetteur.ts";

/** Le port est cloué par `package.json`, et le README interdit d'y toucher. */
const REDIRECTION_PAR_DEFAUT = "http://127.0.0.1:4300/api/auth/retour";
/** `offline_access` porte le rafraîchissement — sans lui, l'écriture se referme hors ligne. */
const PORTEES = ["openid", "profile", "email", "offline_access"];

export interface Fournisseur {
  /** L'API frontale Clerk, par exemple `https://clerk.exemple.com`. */
  emetteur: string;
  clientId: string;
  redirection: string;
}

/**
 * La configuration d'accès, ou `null` quand il n'y en a pas.
 *
 * `null` n'est pas une panne : c'est le cas de quelqu'un qui lit son dossier
 * `.claude` sans jamais se connecter. Lire est gratuit, donc l'application doit
 * démarrer entière sans la moindre variable d'accès. Une configuration à moitié
 * remplie vaut `null` aussi — mieux vaut pas de bouton qu'un bouton qui mène à
 * une redirection cassée.
 */
export function fournisseur(): Fournisseur | null {
  const emetteur = emetteurConfigure();
  const clientId = process.env.ATELIER_ACCES_CLIENT;
  if (!emetteur || !clientId) return null;

  return {
    emetteur,
    clientId,
    redirection: process.env.ATELIER_ACCES_REDIRECTION ?? REDIRECTION_PAR_DEFAUT,
  };
}

/**
 * L'émetteur déclaré, sinon celui que porte la clé publiable.
 *
 * Le déclarer reste possible — domaine personnalisé, instance de rechange —
 * mais dans le cas courant les deux valeurs désigneraient la même instance, et
 * deux valeurs à tenir d'accord finissent toujours par diverger.
 */
function emetteurConfigure(): string | null {
  const declare = process.env.ATELIER_ACCES_EMETTEUR?.replace(/\/$/, "");
  if (declare) return declare;

  const publiable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return publiable ? emetteurDepuisClePubliable(publiable) : null;
}

export function adresseAutorisation(f: Fournisseur, { defi, etat }: { defi: string; etat: string }): string {
  const adresse = new URL(`${f.emetteur}/oauth/authorize`);
  adresse.search = new URLSearchParams({
    response_type: "code",
    client_id: f.clientId,
    redirect_uri: f.redirection,
    scope: PORTEES.join(" "),
    code_challenge: defi,
    code_challenge_method: "S256",
    state: etat,
  }).toString();
  return adresse.toString();
}

export function adresseJeton(f: Fournisseur): string {
  return `${f.emetteur}/oauth/token`;
}

export function corpsEchange(
  f: Fournisseur,
  { code, verifieur }: { code: string; verifieur: string },
): URLSearchParams {
  return new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: verifieur,
    client_id: f.clientId,
    redirect_uri: f.redirection,
  });
}

export function corpsRafraichissement(f: Fournisseur, { jeton }: { jeton: string }): URLSearchParams {
  return new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: jeton,
    client_id: f.clientId,
  });
}
