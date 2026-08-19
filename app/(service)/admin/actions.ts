"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { CHAMP_FAVEUR, estAdmin } from "@/lib/acces/faveur";

export interface RetourFaveur {
  etat: "vierge" | "fait" | "refuse";
  message: string;
}

/**
 * Offrir — ou retirer — l'accès à quelqu'un, par son adresse.
 *
 * Le contrôle d'administration se fait **ici**, jamais dans la page seule :
 * une action serveur est une porte à part entière, atteignable sans passer par
 * l'écran qui la propose. Vérifier à l'affichage ne protège rien.
 */
export async function offrirAcces(
  _precedent: RetourFaveur,
  formulaire: FormData,
): Promise<RetourFaveur> {
  const { userId } = await auth();
  const moi = await currentUser();
  if (!userId || !estAdmin(moi?.primaryEmailAddress?.emailAddress)) {
    return { etat: "refuse", message: "Réservé à l'administrateur." };
  }

  const courriel = String(formulaire.get("courriel") ?? "").trim().toLowerCase();
  const retirer = formulaire.get("retirer") === "1";
  if (!courriel.includes("@")) {
    return { etat: "refuse", message: "Il faut une adresse de courriel." };
  }

  const clerk = await clerkClient();
  const trouves = await clerk.users.getUserList({ emailAddress: [courriel], limit: 2 });
  const cible = trouves.data[0];
  if (!cible) {
    return {
      etat: "refuse",
      message: `Aucun compte pour ${courriel}. La personne doit d'abord créer son compte.`,
    };
  }

  await clerk.users.updateUserMetadata(cible.id, {
    publicMetadata: { ...cible.publicMetadata, [CHAMP_FAVEUR]: !retirer },
  });
  revalidatePath("/admin");

  return {
    etat: "fait",
    message: retirer ? `Accès retiré à ${courriel}.` : `Accès offert à ${courriel}.`,
  };
}
