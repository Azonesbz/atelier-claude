"use server";

import { revalidatePath } from "next/cache";
import { ecritureOuverte } from "@/lib/licence/etat";
import { enregistrerCompetence } from "@/lib/ecriture/competence";

export interface Retour {
  etat: "vierge" | "enregistre" | "refuse";
  message: string;
}

export async function enregistrer(_precedent: Retour, formulaire: FormData): Promise<Retour> {
  // Le verrou est ici, pas dans l'interface : un bouton grisé n'empêche pas
  // d'appeler l'action.
  if (!(await ecritureOuverte())) {
    return {
      etat: "refuse",
      message: "L'écriture demande un abonnement actif. La lecture reste entière — voir la page Licence.",
    };
  }
  const chemin = String(formulaire.get("chemin") ?? "");
  try {
    enregistrerCompetence(chemin, {
      description: String(formulaire.get("description") ?? ""),
      "argument-hint": String(formulaire.get("argument-hint") ?? ""),
      corps: String(formulaire.get("corps") ?? ""),
    });
    revalidatePath("/", "layout");
    return { etat: "enregistre", message: "Écrit sur le disque." };
  } catch (erreur) {
    return { etat: "refuse", message: erreur instanceof Error ? erreur.message : "Refusé." };
  }
}
