/**
 * L'écriture d'une compétence, avec les garde-fous avant le disque.
 *
 * Trois refus, dans cet ordre : hors des racines connues, hors d'un SKILL.md,
 * dans un plugin. Un plugin est un clone de dépôt que la machine ne possède
 * pas — le modifier serait perdu au prochain `plugin update`, en silence.
 */

import { lireTexte } from "../lecture/fichiers.ts";
import { cheminModifiable, EcritureRefusee, ecrireAtomiquement } from "./garde.ts";
import { remplacerChamps, remplacerCorps } from "./frontmatter.ts";

const CHAMPS_EDITABLES = ["description", "argument-hint"] as const;

export interface Modification {
  description?: string;
  "argument-hint"?: string;
  corps?: string;
}

export function enregistrerCompetence(chemin: string, modification: Modification): void {
  const absolu = verifierChemin(chemin);
  const brut = lireTexte(absolu);
  if (brut === null) throw new EcritureRefusee("Fichier introuvable ou illisible.");

  const champs: Record<string, string> = {};
  for (const cle of CHAMPS_EDITABLES) {
    const valeur = modification[cle];
    if (valeur !== undefined) champs[cle] = valeur.replace(/\r?\n/g, " ").trim();
  }

  let ecrit = Object.keys(champs).length > 0 ? remplacerChamps(brut, champs) : brut;
  if (modification.corps !== undefined) ecrit = remplacerCorps(ecrit, modification.corps);

  ecrireAtomiquement(absolu, ecrit);
}

/** Le garde partagé, plus la seule règle propre aux compétences. */
export function verifierChemin(chemin: string): string {
  const absolu = cheminModifiable(chemin);
  if (!absolu.endsWith("/SKILL.md")) {
    throw new EcritureRefusee("Seuls les fichiers SKILL.md sont modifiables ici.");
  }
  return absolu;
}

