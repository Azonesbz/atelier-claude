"use server";

import { revalidatePath } from "next/cache";
import { effacerChoix, ecrireChoix } from "@/lib/lecture/choix";
import { estDossier } from "@/lib/lecture/fichiers";

export interface RetourProjet {
  etat: "vierge" | "fait" | "refuse";
  message: string;
}

/**
 * Change le projet regardé, ou revient à la détection automatique.
 *
 * Le chemin vient du navigateur : on vérifie qu'il désigne un vrai dossier
 * portant un `.claude`, plutôt que de faire lire n'importe où à l'outil. Les
 * garde-fous d'écriture s'appuient sur cette racine.
 */
export async function choisirProjet(
  _precedent: RetourProjet,
  formulaire: FormData,
): Promise<RetourProjet> {
  const projet = String(formulaire.get("projet") ?? "").trim();

  if (!projet) {
    effacerChoix();
    revalidatePath("/", "layout");
    return { etat: "fait", message: "Retour à la détection automatique." };
  }
  if (!projet.startsWith("/")) {
    return { etat: "refuse", message: "Donne un chemin absolu, commençant par /." };
  }
  if (!estDossier(projet)) {
    return { etat: "refuse", message: `${projet} n'est pas un dossier.` };
  }
  if (!estDossier(`${projet}/.claude`)) {
    return {
      etat: "refuse",
      message: `${projet} n'a pas de dossier .claude — il n'y a rien à y lire.`,
    };
  }

  ecrireChoix(projet);
  revalidatePath("/", "layout");
  return { etat: "fait", message: `Projet regardé : ${projet}` };
}
