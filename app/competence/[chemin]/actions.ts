"use server";

import { revalidatePath } from "next/cache";
import { enregistrerCompetence } from "@/lib/ecriture/competence";

export interface Retour {
  etat: "vierge" | "enregistre" | "refuse";
  message: string;
}

export async function enregistrer(_precedent: Retour, formulaire: FormData): Promise<Retour> {
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
