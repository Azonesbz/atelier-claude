import { DEPART, lireCookie, retirer } from "@/lib/acces/cookies";
import { echanger } from "@/lib/acces/echange";
import { interrogerCompte } from "@/lib/acces/identite";
import { fournisseur } from "@/lib/acces/oauth";
import { validerRetour } from "@/lib/acces/parcours";
import { ecrireSession } from "@/lib/acces/session";

/**
 * Le retour du fournisseur : la seule surface qu'un tiers puisse atteindre.
 *
 * Rien n'y est authentifié — l'application vit sur 127.0.0.1. Ce qui tient
 * l'ensemble, c'est l'état gardé en cookie : sans lui, ou différent, on refuse
 * avant même de regarder le code.
 *
 * La session est écrite avec `droit: false`. Se connecter n'achète rien : le
 * droit d'écrire vient du service, qui interroge Stripe.
 */
export async function GET(requete: Request) {
  const f = fournisseur();
  if (!f) return repartir("Aucun fournisseur d'accès configuré.");

  const cookies = requete.headers.get("cookie");
  const issue = validerRetour(new URL(requete.url).searchParams, {
    etat: lireCookie(cookies, DEPART.etat),
  });
  if ("erreur" in issue) return repartir(issue.erreur);

  const verifieur = lireCookie(cookies, DEPART.verifieur);
  if (!verifieur) return repartir("Le vérifieur de cette connexion a expiré. Recommence.");

  const jetons = await echanger(f, { code: issue.code, verifieur });
  if (!jetons) return repartir("L'échange du code auprès du fournisseur a échoué.");

  const compte = await interrogerCompte(f, jetons.acces);
  if (!compte) return repartir("Le fournisseur n'a pas rendu d'identité lisible.");

  ecrireSession({
    compte,
    rafraichissement: jetons.rafraichissement,
    // Connecté ne veut pas dire payé. Le service tranchera.
    droit: false,
    verifieLe: 0,
  });

  return repartir(null);
}

/** On revient toujours sur la page Licence, avec ou sans grief. */
function repartir(erreur: string | null): Response {
  const adresse = new URL("http://127.0.0.1:4300/licence");
  if (erreur) adresse.searchParams.set("erreur", erreur);

  const entetes = new Headers({ Location: adresse.toString() });
  entetes.append("Set-Cookie", retirer(DEPART.verifieur));
  entetes.append("Set-Cookie", retirer(DEPART.etat));

  return new Response(null, { status: 303, headers: entetes });
}
