import { DEPART, poser } from "@/lib/acces/cookies";
import { fournisseur } from "@/lib/acces/oauth";
import { demarrer } from "@/lib/acces/parcours";

/**
 * Ouvre la connexion : garde le vérifieur ici, envoie le défi là-bas.
 *
 * Sans fournisseur configuré, on le dit au lieu de rediriger dans le vide.
 * L'application locale d'un lecteur n'en a pas, et c'est un état normal — lire
 * est gratuit, donc lire ne se connecte pas.
 */
export async function GET() {
  const f = fournisseur();
  if (!f) {
    return Response.json(
      { erreur: "Aucun fournisseur d'accès configuré (ATELIER_ACCES_CLIENT)." },
      { status: 503 },
    );
  }

  const { adresse, verifieur, etat } = demarrer(f);

  const entetes = new Headers({ Location: adresse });
  entetes.append("Set-Cookie", poser(DEPART.verifieur, verifieur));
  entetes.append("Set-Cookie", poser(DEPART.etat, etat));

  return new Response(null, { status: 302, headers: entetes });
}
