"use server";

import { auth } from "@clerk/nextjs/server";
import { lireIdentifiantGithub } from "@/lib/livraison/identifiant";
import { inviterAuDepot } from "@/lib/livraison/github";
import { clientDuCompte } from "@/lib/acces/rattachement";
import { etatDuPaiement } from "@/lib/licence/stripe";

export interface RetourAcces {
  etat: "vierge" | "fait" | "refuse";
  message: string;
}

/**
 * Réclamer l'accès au dépôt depuis son espace client.
 *
 * Le paiement est revérifié **ici**, jamais supposé : cette action est
 * atteignable par n'importe quel compte connecté, et croire un formulaire
 * donnerait le dépôt à qui n'a rien payé.
 */
export async function reclamerAcces(
  _precedent: RetourAcces,
  formulaire: FormData,
): Promise<RetourAcces> {
  const { userId } = await auth();
  if (!userId) return { etat: "refuse", message: "Il faut être connecté." };

  const identifiant = lireIdentifiantGithub(formulaire.get("github"));
  if (!identifiant) {
    return {
      etat: "refuse",
      message:
        "Cet identifiant GitHub n'en est pas un : lettres, chiffres et tirets, 39 caractères au plus.",
    };
  }

  const client = await clientDuCompte(userId);
  const paye = client ? (await etatDuPaiement(client)).paye : false;
  if (!paye) {
    return { etat: "refuse", message: "Aucun achat trouvé pour ce compte." };
  }

  const invitation = await inviterAuDepot(identifiant);
  return { etat: invitation.ok ? "fait" : "refuse", message: invitation.detail };
}
