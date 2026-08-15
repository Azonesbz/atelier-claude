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

/**
 * Une ligne d'étape : un numéro, puis quelque part un fichier `.md`.
 *
 * La première version exigeait exactement trois colonnes et un chemin entre
 * accents graves — la forme de `halo` et de `lancer`, qui écrivent pareil.
 * `giva-flow` en a quatre (la dernière porte « ARRÊT DUR 1 ») et cite ses
 * étapes en liens Markdown : il n'était pas reconnu du tout. On accepte donc
 * trois colonnes ou plus, et les trois façons d'écrire un chemin.
 */
const LIGNE_TABLEAU = /^\|(.+)\|\s*$/;
const CHEMIN_CITE = /`([^`]+\.md)`|\[[^\]]*\]\(([^)]+\.md)\)|(?:^|[\s(])([\w./-]+\.md)(?:[\s)]|$)/;
const CELLULES_MINIMUM = 3;

/** Les cellules d'une ligne de tableau, sans les barres de bord. */
function cellulesDe(ligne: string): string[] | null {
  const trouve = LIGNE_TABLEAU.exec(ligne);
  if (!trouve) return null;
  const cellules = trouve[1].split("|").map((c) => c.trim());
  return cellules.length >= CELLULES_MINIMUM - 1 ? cellules : null;
}

/** Le chemin cité dans une cellule, quelle que soit sa forme. */
function cheminDansLaCellule(cellule: string): string | null {
  const trouve = CHEMIN_CITE.exec(cellule);
  if (!trouve) return null;
  return trouve[1] ?? trouve[2] ?? trouve[3] ?? null;
}

/** Le numéro, le fichier et le rôle d'une ligne — ou null si ce n'en est pas une. */
function lireLaLigne(ligne: string): { numero: string; fichier: string; role: string } | null {
  const cellules = cellulesDe(ligne);
  if (!cellules || !/^\d+$/.test(cellules[0])) return null;

  for (let i = 1; i < cellules.length; i++) {
    const fichier = cheminDansLaCellule(cellules[i]);
    if (!fichier) continue;
    const role = (cellules[i + 1] ?? cellules[i]).replace(/\*\*/g, "").trim();
    return { numero: cellules[0], fichier, role };
  }
  return null;
}
const JETON = /`([^`\s]+)`/g;
const ARRET_DUR = /arrêts?\s+durs?|hard\s+stops?/i;

/** Ce qui précède parfois « arrêt dur » pour en nier un. */
const NEGATION = /\b(pas|aucun|aucune|sans|ni|non|jamais)\b[^.]{0,24}$/i;

/**
 * Le terme est-il employé pour déclarer un arrêt, ou pour en nier un ?
 *
 * Deux compétences écrivent « arrêt dur » précisément pour dire qu'il n'y en a
 * pas ici : `halo/step-01` (« Cet arrêt ne remplace pas l'arrêt dur du plan »)
 * et `giva-flow/step-04`, dont un titre annonce « point d'information, pas
 * arrêt dur ». Les compter donnait trois arrêts là où giva-flow en déclare
 * deux dans sa propre description.
 */
function annonceUnArret(texte: string): boolean {
  const trouve = ARRET_DUR.exec(texte);
  if (!trouve) return false;
  return !NEGATION.test(texte.slice(0, trouve.index));
}

/**
 * Un arrêt dur ne se déduit pas du corps du fichier.
 *
 * On ne lit que la ligne du tableau et les titres du fichier — là où l'auteur
 * l'annonce vraiment —, et jamais une mention qui le nie.
 */
function declareUnArretDur(role: string, contenu: string | null): boolean {
  if (annonceUnArret(role)) return true;
  if (!contenu) return false;
  return contenu
    .split("\n")
    .filter((ligne) => ligne.startsWith("#"))
    .some(annonceUnArret);
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
  /** L'étape nomme elle-même la suivante : la transition est déclarée, pas déduite. */
  suivanteConfirmee: boolean;
  silences: Silence[];
}

export interface Workflow {
  etapes: EtapeWorkflow[];
  /** Fichiers présents dans le sous-dossier mais absents du tableau. */
  orphelins: string[];
  /** Le fichier d'entrée, quand le SKILL.md en désigne un explicitement. */
  depart: string | null;
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
  return corps.split("\n").some((ligne) => lireLaLigne(ligne) !== null);
}

/** Rend null si la compétence ne se déroule pas en étapes. */
export function lireWorkflow(cheminSkill: string, corps: string, resolveur: Resolveur): Workflow | null {
  const racine = dirname(cheminSkill);
  const annonces = arretsAnnoncesDansLeSkill(corps);
  const etapes = corps
    .split("\n")
    .map((ligne) => ({ ligne, lue: lireLaLigne(ligne) }))
    .filter((x): x is { ligne: string; lue: NonNullable<ReturnType<typeof lireLaLigne>> } => x.lue !== null)
    .map((x) => construire(x.lue, x.ligne, racine, resolveur, annonces));

  if (etapes.length === 0) return null;
  confirmerLesTransitions(etapes);
  return { etapes, orphelins: orphelins(racine, etapes), depart: departDeclare(corps, etapes) };
}

/**
 * Le point d'entrée, quand la compétence en désigne un.
 *
 * `halo` finit son SKILL.md par « Commence maintenant par lire et exécuter
 * `steps/step-00-init.md` ». `lancer` ne dit rien : on retombe alors sur la
 * première ligne du tableau, sans prétendre que c'était déclaré.
 */
function departDeclare(corps: string, etapes: EtapeWorkflow[]): string | null {
  const cites = [...corps.matchAll(/`([^`]+\.md)`/g)].map((t) => t[1]);
  const horsTableau = cites.filter(
    (chemin) => !corps.includes(`| \`${chemin}\``) || corps.lastIndexOf(chemin) > corps.lastIndexOf("|"),
  );
  const dernier = horsTableau.at(-1);
  const trouve = etapes.find((e) => e.fichierDeclare === dernier);
  return trouve ? trouve.numero : null;
}

/** Une étape confirme la suivante si son texte nomme le fichier de celle-ci. */
function confirmerLesTransitions(etapes: EtapeWorkflow[]): void {
  for (let i = 0; i < etapes.length - 1; i++) {
    const contenu = lireTexte(etapes[i].cheminAbsolu) ?? "";
    const suivante = etapes[i + 1].fichierDeclare.replace(/^.*\//, "").replace(/\.md$/, "");
    etapes[i].suivanteConfirmee = contenu.includes(suivante);
  }
}

function construire(
  lue: { numero: string; fichier: string; role: string },
  ligne: string,
  racine: string,
  resolveur: Resolveur,
  annonces: Set<string>,
): EtapeWorkflow {
  const { numero, role } = lue;
  const fichierDeclare = lue.fichier;
  const cheminAbsolu = resolve(racine, fichierDeclare);
  const contenu = lireTexte(cheminAbsolu);
  const present = contenu !== null;

  return {
    numero,
    role,
    fichierDeclare,
    cheminAbsolu,
    present,
    lignes: contenu ? contenu.split("\n").length : 0,
    agents: referencesDans(contenu, resolveur.agents),
    competences: referencesDans(contenu, resolveur.competences),
    // Le marqueur peut vivre dans n'importe quelle cellule — `giva-flow` le met
    // dans une quatrième colonne dédiée. Une ligne de tableau n'est pas de la
    // prose : la balayer en entier ne risque pas le faux positif.
    arretDur: annonces.has(numero.padStart(2, "0")) || declareUnArretDur(ligne, contenu),
    suivanteConfirmee: false,
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
function referencesDans(contenu: string | null, connus: string[]): string[] {
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
