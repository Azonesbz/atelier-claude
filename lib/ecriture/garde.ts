/**
 * Les garde-fous partagés par toutes les écritures.
 *
 * Un seul endroit décide de ce qui est modifiable, parce qu'une règle dupliquée
 * est une règle qui divergera. Trois refus, dans cet ordre : chemin hors des
 * racines connues, chemin dans un plugin, fichier déjà là quand on crée.
 */

import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { racineProjet, racineUtilisateur } from "../lecture/fichiers.ts";

export class EcritureRefusee extends Error {}

export type Portee = "utilisateur" | "projet";

/** La racine d'une portée, ou une erreur claire s'il n'y a pas de projet. */
export function racineDe(portee: Portee): string {
  if (portee === "utilisateur") return racineUtilisateur();
  const projet = racineProjet();
  if (!projet) throw new EcritureRefusee("Aucun dossier .claude de projet n'a été trouvé.");
  return projet;
}

/**
 * Vérifie qu'un chemin est modifiable, et le rend en absolu.
 *
 * Un plugin est un clone de dépôt : toute modification y serait écrasée au
 * prochain `claude plugin update`, en silence. On refuse plutôt que de laisser
 * quelqu'un écrire dans le vide.
 */
export function cheminModifiable(chemin: string): string {
  const absolu = resolve(chemin);

  if (absolu.includes("/plugins/marketplaces/") || absolu.includes("/plugins/cache/")) {
    throw new EcritureRefusee(
      "Ce fichier appartient à un plugin. Le modifier ici serait écrasé au prochain " +
        "« claude plugin update », sans avertissement. Modifiez le dépôt du plugin.",
    );
  }

  const racines = [racineUtilisateur(), racineProjet()].filter((r): r is string => r !== null);
  if (!racines.some((racine) => absolu.startsWith(resolve(racine) + "/"))) {
    throw new EcritureRefusee("Ce fichier est hors des dossiers .claude connus.");
  }
  return absolu;
}

/** Refuse d'écraser un fichier existant. Une création n'est pas une modification. */
export function doitEtreLibre(chemin: string): void {
  if (existsSync(chemin)) {
    throw new EcritureRefusee(`${chemin} existe déjà. Rien n'a été écrit.`);
  }
}

/**
 * Écrit par fichier temporaire puis renommage.
 *
 * Une session peut lire au même instant : un renommage est atomique là où une
 * écriture directe peut être vue à moitié faite.
 */
export function ecrireAtomiquement(chemin: string, contenu: string): void {
  mkdirSync(dirname(chemin), { recursive: true });
  const provisoire = `${chemin}.atelier-${process.pid}`;
  writeFileSync(provisoire, contenu, "utf8");
  renameSync(provisoire, chemin);
}

const NOM_VALIDE = /^[a-z][a-z0-9-]{1,48}$/;

/** Un nom d'agent ou d'étape : minuscules, chiffres et tirets. */
export function nomValide(nom: string): string {
  const propre = nom.trim();
  if (!NOM_VALIDE.test(propre)) {
    throw new EcritureRefusee(
      `« ${propre} » n'est pas un nom valide : minuscules, chiffres et tirets, ` +
        "en commençant par une lettre.",
    );
  }
  return propre;
}

/** Transforme un titre libre en identifiant utilisable comme nom de fichier. */
export function enSlug(titre: string): string {
  return titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
