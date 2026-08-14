/**
 * Réécriture chirurgicale du frontmatter : on ne touche que les lignes visées.
 *
 * Surtout NE PAS re-sérialiser le YAML. `argument-hint: [step] <demande>` est
 * lu par YAML comme une séquence en flot suivie de texte parasite ; le
 * réécrire depuis la structure analysée détruirait la ligne. Claude Code, lui,
 * lit ce fichier très bien. La règle est donc : ce que l'utilisateur n'a pas
 * modifié doit ressortir identique, octet pour octet.
 */

import { EcritureRefusee } from "./garde.ts";

export { EcritureRefusee };

const DELIMITEUR = /^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/;

/**
 * Remplace la valeur des clés données, en laissant le reste intact.
 *
 * Une clé absente du frontmatter est ajoutée à la fin de l'en-tête ; une clé
 * dont la nouvelle valeur est vide est retirée. Les lignes non visées, y
 * compris les commentaires et les lignes vides, ne bougent pas.
 */
export function remplacerChamps(brut: string, champs: Record<string, string>): string {
  const trouve = DELIMITEUR.exec(brut);
  if (!trouve) throw new EcritureRefusee("Ce fichier n'a pas de frontmatter délimité par ---.");

  const [entier, ouverture, entete, fermeture] = trouve;
  const corps = brut.slice(entier.length);

  let lignes = entete.split(/\r?\n/);
  for (const [cle, valeur] of Object.entries(champs)) {
    lignes = appliquer(lignes, cle, valeur);
  }
  return ouverture + lignes.join("\n") + fermeture + corps;
}

function appliquer(lignes: string[], cle: string, valeur: string): string[] {
  const motif = new RegExp(`^${echapper(cle)}\\s*:`);
  const index = lignes.findIndex((l) => motif.test(l));
  const vide = valeur.trim() === "";

  if (index === -1) return vide ? lignes : [...lignes, `${cle}: ${valeur}`];

  const suite = [...lignes];
  if (vide) {
    suite.splice(index, 1);
    return suite;
  }
  suite[index] = `${cle}: ${valeur}`;
  return suite;
}

/** Remplace le corps sans toucher au frontmatter. */
export function remplacerCorps(brut: string, corps: string): string {
  const trouve = DELIMITEUR.exec(brut);
  if (!trouve) throw new EcritureRefusee("Ce fichier n'a pas de frontmatter délimité par ---.");
  return brut.slice(0, trouve[0].length) + corps;
}

function echapper(valeur: string): string {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
