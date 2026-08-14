"use server";

import { revalidatePath } from "next/cache";
import { brancherAgent, creerAgent } from "@/lib/ecriture/agent";
import { ajouterEtape } from "@/lib/ecriture/etape";
import type { Portee } from "@/lib/ecriture/garde";
import { lireAtelier } from "@/lib/lecture/atelier";
import { lireWorkflow } from "@/lib/lecture/workflow";

export interface Retour {
  etat: "vierge" | "fait" | "refuse";
  message: string;
}

/** Relit le workflow depuis le disque : l'état du formulaire ne fait pas foi. */
function relire(cheminSkill: string) {
  const atelier = lireAtelier();
  const competence = atelier.competences.find((c) => c.chemin === cheminSkill);
  if (!competence) throw new Error("Compétence introuvable.");
  const workflow = lireWorkflow(competence.chemin, competence.corps, {
    agents: atelier.agents.map((a) => a.nom),
    competences: atelier.competences.map((c) => c.nom),
  });
  if (!workflow) throw new Error("Cette compétence n'a pas de tableau d'étapes.");
  return workflow;
}

function aboutir(action: () => string): Retour {
  try {
    const message = action();
    revalidatePath("/", "layout");
    return { etat: "fait", message };
  } catch (erreur) {
    return { etat: "refuse", message: erreur instanceof Error ? erreur.message : "Refusé." };
  }
}

export async function ajouter(_precedent: Retour, formulaire: FormData): Promise<Retour> {
  return aboutir(() => {
    const cheminSkill = String(formulaire.get("skill") ?? "");
    const ecrit = ajouterEtape(cheminSkill, relire(cheminSkill), {
      titre: String(formulaire.get("titre") ?? ""),
      sortieAttendue: String(formulaire.get("sortie") ?? ""),
    });
    return `Étape créée : ${ecrit.split("/").slice(-2).join("/")}`;
  });
}

export async function brancher(_precedent: Retour, formulaire: FormData): Promise<Retour> {
  return aboutir(() => {
    const resultat = brancherAgent(
      String(formulaire.get("etape") ?? ""),
      String(formulaire.get("agent") ?? ""),
    );
    return resultat === "ajoute"
      ? "Branché dans la section Sous-agents."
      : "Déjà nommé dans cette étape — rien n'a été écrit.";
  });
}

export async function creer(_precedent: Retour, formulaire: FormData): Promise<Retour> {
  return aboutir(() => {
    const chemin = creerAgent(String(formulaire.get("portee") ?? "utilisateur") as Portee, {
      nom: String(formulaire.get("nom") ?? ""),
      description: String(formulaire.get("description") ?? ""),
      outils: String(formulaire.get("outils") ?? ""),
      modele: String(formulaire.get("modele") ?? ""),
    });
    return `Agent créé : ${chemin}`;
  });
}
