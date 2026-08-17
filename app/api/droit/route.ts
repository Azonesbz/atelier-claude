import { interrogerCompte } from "@/lib/acces/identite";
import { fournisseur } from "@/lib/acces/oauth";
import { clientDuCompte } from "@/lib/acces/rattachement";
import { etatDuPaiement } from "@/lib/licence/stripe";

/**
 * « Cette personne a-t-elle payé ? » — tout ce que le service expose en lecture.
 *
 * L'application locale présente son jeton d'accès ; le service le fait valider
 * par le fournisseur, ce qui prouve l'identité sans qu'elle ait à être
 * déclarée. Un identifiant de compte envoyé en clair serait falsifiable.
 *
 * Aucune donnée personnelle n'est renvoyée, et rien du dossier `.claude` de qui
 * que ce soit n'arrive jamais ici.
 *
 * `droit: null` veut dire « je ne sais pas » — service indisponible. C'est
 * distinct de `false`, qui est un refus constaté. L'application locale garde
 * son cache sur `null` : une panne ne referme pas l'écriture de quelqu'un qui a
 * payé.
 */
export async function GET(requete: Request) {
  const f = fournisseur();
  const porteur = requete.headers.get("authorization")?.replace(/^Bearer /i, "") ?? "";

  if (!f) return Response.json({ droit: null, raison: "Service mal configuré." }, { status: 503 });
  if (!porteur) return Response.json({ droit: false, raison: "Aucun jeton présenté." });

  const compte = await interrogerCompte(f, porteur);
  if (!compte) {
    return Response.json({ droit: false, raison: "Ce jeton n'ouvre aucun compte connu." });
  }

  try {
    const client = await clientDuCompte(compte.id);
    if (!client) return Response.json({ droit: false, raison: "Aucun achat pour ce compte." });

    const etat = await etatDuPaiement(client);
    return Response.json({
      droit: etat.paye,
      achetéLe: etat.le,
      raison: etat.raison === "rembourse" ? "Cet achat a été remboursé." : etat.raison ? "Aucun achat pour ce compte." : null,
    });
  } catch {
    // Une panne de Stripe n'est pas un refus.
    return Response.json({ droit: null, raison: "Service indisponible." }, { status: 503 });
  }
}
