/**
 * Les workflows : les compétences qui s'exécutent en étapes numérotées.
 *
 * Un dossier `.claude` ne contient aucun graphe, et Claude Code n'en exécute
 * pas. Mais certaines compétences — `halo`, `lancer`, `skill-creator` — se
 * déroulent en étapes, déclarées dans un tableau et rangées dans un
 * sous-dossier. C'est cette structure-là qu'on lit, telle qu'elle est écrite.
 *
 * On n'invente aucune arête. Le tableau donne l'ordre, les fichiers donnent le
 * contenu, et leur croisement donne l'écart : une étape annoncée dont le
 * fichier manque ne sera jamais exécutée, et rien ne le dit.
 */

import { dirname, join, resolve } from "node:path";
import type { Silence } from "../types.ts";
import { estDossier, listerFichiers, lireTexte } from "./fichiers.ts";

/** `| 02 | `steps/step-02-plan.md` | Plan dans le fil → arrêt dur | */
const LIGNE_ETAPE = /^\|\s*(\d+)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$/;
const CHEMIN_CITE = /`([^`]+\.md)`/;
const JETON = /`([^`\s]+)`/g;
const ARRET_DUR = /arrêts?\s+durs?|hard\s+stops?/i;

/**
 * Un arrêt dur ne se déduit pas du corps du fichier.
 *
 * `step-01-analyze.md` de `halo` contient « arrêt dur » uniquement pour dire
 * qu'il n'en a pas : « Cet arrêt ne remplace pas l'arrêt dur du plan ». Une
 * recherche plein texte comptait donc deux arrêts là où `step-02` se déclare
 * « le seul arrêt dur de HALO ». On ne lit plus que la cellule du tableau et
 * les titres du fichier — là où l'auteur l'annonce vraiment.
 */
function declareUnArretDur(role: string, contenu: string | null): boolean {
  if (ARRET_DUR.test(role)) return true;
  if (!contenu) return false;
  return contenu
    .split("\n")
    .filter((ligne) => ligne.startsWith("#"))
    .some((titre) => ARRET_DUR.test(titre));
}

const RENVOI_ETAPE = /(?:étapes?|steps?)[\s-]*(\d+)/gi;

/**
 * Les numéros d'étape cités dans une section « arrêts durs » du SKILL.md.
 *
 * `lancer` n'annonce ses trois arrêts nulle part ailleurs : ni dans la cellule
 * du tableau, ni dans les titres des fichiers d'étape, mais dans une section
 * « ## Trois arrêts durs » qui les énumère. Deux compétences, deux conventions —
 * on lit les deux plutôt que d'en imposer une.
 */
function arretsAnnoncesDansLeSkill(corps: string): Set<string> {
  const lignes = corps.split("\n");
  const trouves = new Set<string>();
  let dansLaSection = false;
  let niveau = 0;

  for (const ligne of lignes) {
    const titre = /^(#{1,6})\s+(.*)$/.exec(ligne);
    if (titre) {
      const niveauCourant = titre[1].length;
      if (dansLaSection && niveauCourant <= niveau) dansLaSection = false;
      if (ARRET_DUR.test(titre[2])) {
        dansLaSection = true;
        niveau = niveauCourant;
      }
      continue;
    }
    if (!dansLaSection) continue;
    for (const [, numero] of ligne.matchAll(RENVOI_ETAPE)) {
      trouves.add(numero.padStart(2, "0"));
    }
  }
  return trouves;
}

export interface EtapeWorkflow {
  numero: string;
  role: string;
  fichierDeclare: string;
  cheminAbsolu: string;
  present: boolean;
  lignes: number;
  agents: string[];
  competences: string[];
  arretDur: boolean;
  silences: Silence[];
}

export interface Workflow {
  etapes: EtapeWorkflow[];
  /** Fichiers présents dans le sous-dossier mais absents du tableau. */
  orphelins: string[];
}

export interface Resolveur {
  agents: string[];
  competences: string[];
}

/**
 * Test bon marché : ce corps contient-il un tableau d'étapes ?
 *
 * Sert à la liste d'accueil, qui ne doit pas ouvrir tous les fichiers d'étapes
 * de toutes les compétences pour afficher un lien.
 */
export function aDesEtapes(corps: string): boolean {
  return corps.split("\n").some((ligne) => {
    const trouve = LIGNE_ETAPE.exec(ligne);
    return trouve !== null && CHEMIN_CITE.test(trouve[2]);
  });
}

/** Rend null si la compétence ne se déroule pas en étapes. */
export function lireWorkflow(cheminSkill: string, corps: string, resolveur: Resolveur): Workflow | null {
  const racine = dirname(cheminSkill);
  const annonces = arretsAnnoncesDansLeSkill(corps);
  const etapes = corps
    .split("\n")
    .map((ligne) => LIGNE_ETAPE.exec(ligne))
    .filter((t): t is RegExpExecArray => t !== null)
    .map((t) => construire(t, racine, resolveur, annonces))
    .filter((e): e is EtapeWorkflow => e !== null);

  if (etapes.length === 0) return null;
  return { etapes, orphelins: orphelins(racine, etapes) };
}

function construire(
  trouve: RegExpExecArray,
  racine: string,
  resolveur: Resolveur,
  annonces: Set<string>,
): EtapeWorkflow | null {
  const [, numero, cellule, role] = trouve;
  const cite = CHEMIN_CITE.exec(cellule);
  if (!cite) return null;

  const fichierDeclare = cite[1];
  const cheminAbsolu = resolve(racine, fichierDeclare);
  const contenu = lireTexte(cheminAbsolu);
  const present = contenu !== null;

  return {
    numero,
    role: role.replace(/\*\*/g, "").trim(),
    fichierDeclare,
    cheminAbsolu,
    present,
    lignes: contenu ? contenu.split("\n").length : 0,
    agents: referencesDans(contenu, resolveur.agents),
    competences: referencesDans(contenu, resolveur.competences),
    arretDur: annonces.has(numero.padStart(2, "0")) || declareUnArretDur(role, contenu),
    silences: present
      ? []
      : [{
          cause: "étape déclarée, fichier absent",
          detail: `Le tableau annonce « ${fichierDeclare} », rien n'est à ce chemin. L'étape ne s'exécutera jamais.`,
        }],
  };
}

/**
 * Les noms cités entre accents graves qui correspondent à quelque chose de réel.
 *
 * On ne résout que ce qui existe sur le disque. Un mot qui ressemble à un agent
 * sans en être un — `Explore` et les autres agents intégrés, par exemple — n'est
 * pas signalé : l'annoncer comme introuvable serait un faux positif.
 */
export function referencesDans(contenu: string | null, connus: string[]): string[] {
  if (!contenu) return [];
  const index = new Set(connus);
  const trouves = new Set<string>();

  for (const [, jeton] of contenu.matchAll(JETON)) {
    const nu = jeton.replace(/^\/+/, "").replace(/[.,;:)]+$/, "");
    if (index.has(nu)) trouves.add(nu);
  }
  return [...trouves].sort();
}

function orphelins(racine: string, etapes: EtapeWorkflow[]): string[] {
  const declares = new Set(etapes.map((e) => e.cheminAbsolu));
  const sousDossiers = new Set(etapes.map((e) => dirname(e.cheminAbsolu)));

  const trouves: string[] = [];
  for (const dossier of sousDossiers) {
    if (!estDossier(dossier)) continue;
    for (const fichier of listerFichiers(dossier, ".md")) {
      const chemin = join(dossier, fichier);
      if (!declares.has(chemin)) trouves.push(chemin);
    }
  }
  return trouves.sort();
}
