/**
 * Les compétences : ce qui est sur le disque, et ce qui sera réellement vu.
 *
 * Le cœur de l'affaire est là. Deux compétences peuvent être identiques à
 * l'œil et n'avoir pas du tout le même sort : `disable-model-invocation: true`
 * la rend invisible du modèle, un frontmatter illisible la fait ignorer sans
 * un mot, un `name` qui ne correspond pas au répertoire brouille l'invocation.
 */

import { basename, join } from "node:path";
import type { Competence, Portee, Silence } from "../types.ts";
import { decouper, estDossier, listerDossiers, lireTexte } from "./fichiers.ts";

/** Longueur au-delà de laquelle la description est tronquée dans le listing. */
const DESCRIPTION_MAX = 1024;

export function lireCompetences(racine: string, portee: Portee, origine: string): Competence[] {
  const dossier = join(racine, "skills");
  if (!estDossier(dossier)) return [];
  return listerDossiers(dossier)
    .map((nom) => lireUne(join(dossier, nom), portee, origine))
    .filter((c): c is Competence => c !== null);
}

function lireUne(dossier: string, portee: Portee, origine: string): Competence | null {
  const chemin = join(dossier, "SKILL.md");
  const brut = lireTexte(chemin);
  if (brut === null) return null;

  const { entete, corps, enteteValide } = decouper(brut);
  const nomRepertoire = basename(dossier);
  const nomDeclare = texte(entete.name) || nomRepertoire;
  const description = texte(entete.description);

  return {
    nom: nomDeclare,
    portee,
    origine,
    chemin,
    description,
    invocableParLeModele: !vrai(entete["disable-model-invocation"]),
    invocableParLUtilisateur: entete["user-invocable"] === undefined || vrai(entete["user-invocable"]),
    outilsAutorises: liste(entete["allowed-tools"]),
    indiceArgument: indice(entete["argument-hint"]),
    corps,
    lignes: corps.split("\n").length,
    silences: silences(entete, enteteValide, nomDeclare, nomRepertoire, description),
  };
}

function silences(
  entete: Record<string, unknown>,
  enteteValide: boolean,
  nomDeclare: string,
  nomRepertoire: string,
  description: string,
): Silence[] {
  const trouves: Silence[] = [];

  if (!enteteValide) {
    trouves.push({
      cause: "frontmatter illisible",
      detail: "Claude Code ignore la compétence sans le dire. Le fichier est là, il ne sert à rien.",
    });
    return trouves;
  }
  // Un `name` différent du répertoire n'est PAS une anomalie. Test contrôlé du
  // 14 août 2026 sur 2.1.227 : un répertoire « repertoire-aaa » portant
  // `name: frontmatter-zzz` s'affiche sous « frontmatter-zzz ». La divergence
  // est visible dans le détail, elle n'est pas peinte en rouge.
  if (!description) {
    trouves.push({
      cause: "aucune description",
      detail: "Sans description, le modèle n'a rien pour décider de charger la compétence.",
    });
  }
  if (description.length > DESCRIPTION_MAX) {
    trouves.push({
      cause: "description trop longue",
      detail: `${description.length} caractères : le listing tronque au-delà de ${DESCRIPTION_MAX}.`,
    });
  }
  // `disable-model-invocation: true` n'est PAS une anomalie : c'est un choix,
  // et `lancer` comme `halo` le portent volontairement. L'étiquette de la liste
  // suffit à le dire. Le signaler ici reviendrait à crier au loup — le défaut
  // qui rend un inspecteur pire qu'aucun inspecteur.
  return trouves;
}

/**
 * Le « vrai » de Claude Code : le booléen `true`, ou la chaîne `"true"`.
 *
 * Tout le reste vaut faux, y compris `yes`, `1` ou `oui`. La lecture souple
 * ligne à ligne rend des chaînes là où YAML strict rendrait des booléens : les
 * deux formes doivent donc être acceptées, et elles seules.
 */
function vrai(valeur: unknown): boolean {
  return valeur === true || valeur === "true";
}

function texte(valeur: unknown): string {
  return typeof valeur === "string" ? valeur.trim() : "";
}

/**
 * L'indice d'argument, qui n'est pas toujours une chaîne.
 *
 * `argument-hint: [filtre — un statut, un palier]` est du YAML parfaitement
 * valide : une séquence en flot d'un seul élément. L'auteur voulait écrire des
 * crochets, YAML y a vu un tableau. On rend l'intention, pas la structure.
 */
function indice(valeur: unknown): string {
  if (Array.isArray(valeur)) return `[${valeur.map(String).join(", ")}]`;
  return texte(valeur);
}

function liste(valeur: unknown): string[] {
  if (Array.isArray(valeur)) return valeur.map(String);
  if (typeof valeur === "string") return valeur.split(",").map((v) => v.trim()).filter(Boolean);
  return [];
}
