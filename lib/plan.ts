/**
 * La mise en plan d'un workflow : des blocs et des liens, à des coordonnées fixes.
 *
 * Pas de simulation de forces ici. Un workflow a un ordre — l'étape 00 puis la
 * 01, et ainsi de suite — et une simulation le mélangerait à chaque
 * rafraîchissement. Le calcul est donc déterministe : la colonne de gauche
 * porte la séquence, la droite ce que chaque étape appelle.
 *
 * Le nom du workflow n'est pas un nœud. C'est le titre de la page : le vrai
 * point de départ est la première étape.
 */

import type { EtapeWorkflow, Workflow } from "./lecture/workflow.ts";

export const BLOC = { largeur: 400, hauteur: 68 };
export const SATELLITE = { largeur: 190, hauteur: 32 };
const ESPACE_VERTICAL = 30;
const COLONNE_SATELLITES = 520;
const MARGE_HAUT = 56;

export type SorteSatellite = "agent" | "competence";

export interface BlocEtape {
  etape: EtapeWorkflow;
  x: number;
  y: number;
  depart: boolean;
}

export interface BlocSatellite {
  id: string;
  nom: string;
  sorte: SorteSatellite;
  x: number;
  y: number;
}

export interface Lien {
  de: { x: number; y: number };
  vers: { x: number; y: number };
  sorte: "sequence" | "appel";
  /** Faux quand l'ordre vient du tableau sans que l'étape nomme sa suivante. */
  confirme: boolean;
}

export interface Plan {
  blocs: BlocEtape[];
  satellites: BlocSatellite[];
  liens: Lien[];
  largeur: number;
  hauteur: number;
}

export function mettreEnPlan(workflow: Workflow): Plan {
  const blocs = workflow.etapes.map((etape, index) => ({
    etape,
    x: 0,
    y: MARGE_HAUT + index * (BLOC.hauteur + ESPACE_VERTICAL),
    depart: workflow.depart ? etape.numero === workflow.depart : index === 0,
  }));

  const satellites = placerSatellites(blocs);
  const liens = [...liensDeSequence(blocs), ...liensDAppel(blocs, satellites)];

  const basBlocs = blocs.at(-1);
  const basSatellites = satellites.at(-1);
  const hauteur =
    Math.max(basBlocs ? basBlocs.y + BLOC.hauteur : 0, basSatellites ? basSatellites.y + SATELLITE.hauteur : 0) +
    MARGE_HAUT;

  return { blocs, satellites, liens, largeur: COLONNE_SATELLITES + SATELLITE.largeur, hauteur };
}

/**
 * Chaque appelé une seule fois, à hauteur de ses appelants.
 *
 * Un agent invoqué par trois étapes ne doit pas apparaître trois fois : ce
 * serait mentir sur la structure. Il est posé à la hauteur moyenne de ceux qui
 * l'appellent, puis descendu si la place est prise.
 */
function placerSatellites(blocs: BlocEtape[]): BlocSatellite[] {
  const hauteurs = new Map<string, { sorte: SorteSatellite; nom: string; ys: number[] }>();

  for (const bloc of blocs) {
    const centre = bloc.y + BLOC.hauteur / 2;
    for (const nom of bloc.etape.agents) accumuler(hauteurs, `agent:${nom}`, "agent", nom, centre);
    for (const nom of bloc.etape.competences) accumuler(hauteurs, `competence:${nom}`, "competence", nom, centre);
  }

  const candidats = [...hauteurs.entries()]
    .map(([id, { sorte, nom, ys }]) => ({
      id,
      nom,
      sorte,
      x: COLONNE_SATELLITES,
      y: ys.reduce((a, b) => a + b, 0) / ys.length - SATELLITE.hauteur / 2,
    }))
    .sort((a, b) => a.y - b.y);

  let plancher = -Infinity;
  for (const satellite of candidats) {
    satellite.y = Math.max(satellite.y, plancher);
    plancher = satellite.y + SATELLITE.hauteur + 10;
  }
  return candidats;
}

function accumuler(
  index: Map<string, { sorte: SorteSatellite; nom: string; ys: number[] }>,
  id: string,
  sorte: SorteSatellite,
  nom: string,
  y: number,
) {
  const entree = index.get(id);
  if (entree) entree.ys.push(y);
  else index.set(id, { sorte, nom, ys: [y] });
}

function liensDeSequence(blocs: BlocEtape[]): Lien[] {
  const liens: Lien[] = [];
  for (let i = 0; i < blocs.length - 1; i++) {
    liens.push({
      de: { x: BLOC.largeur / 2, y: blocs[i].y + BLOC.hauteur },
      vers: { x: BLOC.largeur / 2, y: blocs[i + 1].y },
      sorte: "sequence",
      confirme: blocs[i].etape.suivanteConfirmee,
    });
  }
  return liens;
}

function liensDAppel(blocs: BlocEtape[], satellites: BlocSatellite[]): Lien[] {
  const parId = new Map(satellites.map((s) => [s.id, s]));
  const liens: Lien[] = [];

  for (const bloc of blocs) {
    const depart = { x: BLOC.largeur, y: bloc.y + BLOC.hauteur / 2 };
    const cibles = [
      ...bloc.etape.agents.map((nom) => `agent:${nom}`),
      ...bloc.etape.competences.map((nom) => `competence:${nom}`),
    ];
    for (const id of cibles) {
      const satellite = parId.get(id);
      if (!satellite) continue;
      liens.push({
        de: depart,
        vers: { x: satellite.x, y: satellite.y + SATELLITE.hauteur / 2 },
        sorte: "appel",
        confirme: true,
      });
    }
  }
  return liens;
}
