/**
 * Les primitives de lecture : racines, JSON tolérant, frontmatter.
 *
 * Tout ce qui touche le disque passe par ici. Aucune de ces fonctions ne lève :
 * un fichier absent est une situation normale (settings.local.json l'est
 * souvent), et une interface qui plante sur un fichier manquant est inutile.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, parse } from "node:path";
import { parse as parseYaml } from "yaml";
import { lireChoix } from "./choix.ts";

/** Le dossier .claude de l'utilisateur, isolable pour les tests. */
export function racineUtilisateur(): string {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
}

/**
 * Le dossier .claude du projet regardé, ou null s'il n'y en a pas.
 *
 * Trois sources, dans cet ordre :
 *
 * 1. `ATELIER_PROJET` — un lancement explicite, et les tests. Il gagne, et
 *    l'interface le dit plutôt que de laisser croire que le choix est ignoré.
 * 2. le projet choisi dans l'interface, gardé d'une session à l'autre ;
 * 3. la remontée d'arborescence depuis le dossier courant, comme le fait
 *    Claude Code lui-même — ce qui rend l'outil utile sans rien configurer.
 */
export function racineProjet(): string | null {
  const impose = process.env.ATELIER_PROJET;
  const choisi = impose || lireChoix();
  let courant = choisi || process.cwd();

  if (choisi) {
    const direct = join(courant, ".claude");
    return estDossier(direct) ? direct : null;
  }

  const racineDuDisque = parse(courant).root;

  while (true) {
    const candidat = join(courant, ".claude");
    if (estDossier(candidat) && candidat !== racineUtilisateur()) return candidat;
    if (courant === racineDuDisque) return null;
    courant = dirname(courant);
  }
}

export function estDossier(chemin: string): boolean {
  try {
    return statSync(chemin).isDirectory();
  } catch {
    return false;
  }
}

/** Vrai si le chemin est un dossier contenant au moins un fichier. */
export function contientUnFichier(chemin: string): boolean {
  if (!chemin || !estDossier(chemin)) return false;
  for (const entree of listerRecursif(chemin, 4)) {
    if (!estDossier(entree)) return true;
  }
  return false;
}

export function lireTexte(chemin: string): string | null {
  try {
    return readFileSync(chemin, "utf8");
  } catch {
    return null;
  }
}

/** Le contenu d'un JSON, ou un objet vide s'il est absent ou illisible. */
export function lireJson(chemin: string): Record<string, unknown> {
  const brut = lireTexte(chemin);
  if (!brut) return {};
  try {
    const valeur = JSON.parse(brut);
    return valeur && typeof valeur === "object" ? valeur : {};
  } catch {
    return {};
  }
}

export function listerDossiers(chemin: string): string[] {
  try {
    return readdirSync(chemin, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

export function listerFichiers(chemin: string, extension: string): string[] {
  try {
    return readdirSync(chemin, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(extension))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

function* listerRecursif(chemin: string, profondeur: number): Generator<string> {
  if (profondeur <= 0) return;
  for (const nom of listerDossiers(chemin)) {
    yield* listerRecursif(join(chemin, nom), profondeur - 1);
  }
  for (const nom of listerFichiers(chemin, "")) {
    yield join(chemin, nom);
  }
}

export interface Decoupe {
  entete: Record<string, unknown>;
  corps: string;
  enteteValide: boolean;
  /** Vrai quand YAML strict a échoué mais que la lecture ligne à ligne a suffi. */
  tolere: boolean;
}

const DELIMITEUR = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const LIGNE_CLE = /^([A-Za-z][\w.-]*)\s*:\s*(.*)$/;

/**
 * Sépare le frontmatter du corps, en étant aussi tolérant que Claude Code.
 *
 * ATTENTION — leçon payée. Une première version déclarait « illisible » tout
 * frontmatter que la bibliothèque `yaml` refusait, et signalait donc comme
 * morte la compétence `halo`. Le coupable est
 * `argument-hint: [step] <demande en langage naturel>` : YAML lit `[step]`
 * comme une séquence en flot, puis bute sur le texte qui suit. Test contrôlé
 * du 14 août 2026 sur 2.1.227, quatre compétences en configuration isolée :
 * Claude Code charge parfaitement ce fichier. Seul
 * `disable-model-invocation: true` la retirait de la liste.
 *
 * Un outil qui annonce une panne inexistante est pire que pas d'outil. On
 * tente donc YAML strict, puis une lecture ligne à ligne, et on ne déclare
 * illisible que si les deux échouent.
 */
export function decouper(brut: string): Decoupe {
  const trouve = DELIMITEUR.exec(brut);
  if (!trouve) return { entete: {}, corps: brut, enteteValide: false, tolere: false };

  const corps = brut.slice(trouve[0].length);

  const strict = parserStrict(trouve[1]);
  if (strict) return { entete: strict, corps, enteteValide: true, tolere: false };

  const souple = parserLigneAligne(trouve[1]);
  if (Object.keys(souple).length > 0) {
    return { entete: souple, corps, enteteValide: true, tolere: true };
  }
  return { entete: {}, corps, enteteValide: false, tolere: false };
}

function parserStrict(entete: string): Record<string, unknown> | null {
  try {
    const valeur = parseYaml(entete);
    return valeur && typeof valeur === "object" ? (valeur as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Lecture `cle: valeur`, une ligne à la fois, sans rien interpréter d'autre. */
function parserLigneAligne(entete: string): Record<string, unknown> {
  const trouve: Record<string, unknown> = {};
  for (const ligne of entete.split(/\r?\n/)) {
    const paire = LIGNE_CLE.exec(ligne);
    if (!paire) continue;
    trouve[paire[1]] = convertir(paire[2].trim());
  }
  return trouve;
}

function convertir(valeur: string): unknown {
  if (valeur === "true") return true;
  if (valeur === "false") return false;
  const quote = /^(["'])([\s\S]*)\1$/.exec(valeur);
  return quote ? quote[2] : valeur;
}
