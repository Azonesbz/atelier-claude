import { interrogerCompte } from "@/lib/acces/identite";
import { fournisseur } from "@/lib/acces/oauth";
import { verdictDuCompte } from "@/lib/acces/verdict";

/**
 * « Cette personne a-t-elle le droit d'écrire ? » — tout ce que le service
 * expose en lecture.
 *
 * L'application locale présente son jeton d'accès ; le service le fait valider
 * par le fournisseur, ce qui prouve l'identité sans qu'elle ait à être
 * déclarée. Un identifiant de compte envoyé en clair serait falsifiable.
 *
 * `droit: null` veut dire « je ne sais pas » — service indisponible. C'est
 * distinct de `false`, qui est un refus constaté, et c'est ce qui permet au
 * cache local de ne pas se refermer sur une panne.
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
    const verdict = await verdictDuCompte(compte.id);
    return Response.json({
      droit: verdict.droit,
      source: verdict.source,
      "achetéLe": verdict.achatLe,
      raison: verdict.droit ? null : verdict.detail,
    });
  } catch {
    return Response.json({ droit: null, raison: "Service indisponible." }, { status: 503 });
  }
}
