/**
 * L'écriture d'une compétence, avec les garde-fous avant le disque.
 *
 * Trois refus, dans cet ordre : hors des racines connues, hors d'un SKILL.md,
 * dans un plugin. Un plugin est un clone de dépôt que la machine ne possède
 * pas — le modifier serait perdu au prochain `plugin update`, en silence.
 */

import { renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { lireTexte, racineProjet, racineUtilisateur } from "../lecture/fichiers.ts";
import { EcritureRefusee, remplacerChamps, remplacerCorps } from "./frontmatter.ts";

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

/** Le chemin est-il un SKILL.md que cette machine a le droit de modifier ? */
export function verifierChemin(chemin: string): string {
  const absolu = resolve(chemin);

  if (!absolu.endsWith("/SKILL.md")) {
    throw new EcritureRefusee("Seuls les fichiers SKILL.md sont modifiables ici.");
  }
  if (absolu.includes("/plugins/marketplaces/") || absolu.includes("/plugins/cache/")) {
    throw new EcritureRefusee(
      "Cette compétence appartient à un plugin. La modifier ici serait écrasé au prochain " +
        "« claude plugin update », sans avertissement. Modifiez le dépôt du plugin.",
    );
  }

  const racines = [racineUtilisateur(), racineProjet()].filter((r): r is string => r !== null);
  if (!racines.some((racine) => absolu.startsWith(resolve(racine) + "/"))) {
    throw new EcritureRefusee("Ce fichier est hors des dossiers .claude connus.");
  }
  return absolu;
}

/**
 * Écrit par fichier temporaire puis renommage.
 *
 * Une session peut lire le fichier au même instant : un renommage est atomique
 * là où une écriture directe peut être vue à moitié faite.
 */
function ecrireAtomiquement(chemin: string, contenu: string): void {
  const provisoire = `${chemin}.atelier-${process.pid}`;
  writeFileSync(provisoire, contenu, "utf8");
  renameSync(provisoire, chemin);
}
