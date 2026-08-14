/**
 * Le modèle côté client : nœuds positionnés, voisinages, palette.
 *
 * `d3-force` mute les objets qu'on lui donne — il y écrit x, y, vx, vy. On lui
 * passe donc des copies, jamais les données rendues par le serveur.
 */

import type { Arete, Graphe, Noeud, SorteNoeud } from "@/lib/lecture/graphe";

export interface NoeudPlace extends Noeud {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  degre: number;
  rayon: number;
}

export interface ArtePlacee extends Omit<Arete, "source" | "cible"> {
  source: NoeudPlace;
  cible: NoeudPlace;
}

const RAYON_MIN = 4;
const RAYON_MAX = 16;

/** Copie les données du serveur en objets que la simulation peut malmener. */
export function preparer(graphe: Graphe, masquerIsoles: boolean) {
  const degres = new Map<string, number>();
  for (const arete of graphe.aretes) {
    degres.set(arete.source, (degres.get(arete.source) ?? 0) + 1);
    degres.set(arete.cible, (degres.get(arete.cible) ?? 0) + 1);
  }

  const retenus = graphe.noeuds.filter((n) => !masquerIsoles || degres.has(n.id));
  const parId = new Map<string, NoeudPlace>();

  retenus.forEach((noeud, index) => {
    const degre = degres.get(noeud.id) ?? 0;
    parId.set(noeud.id, { ...noeud, ...positionInitiale(index), degre, rayon: rayon(degre) });
  });

  const aretes: ArtePlacee[] = [];
  for (const arete of graphe.aretes) {
    const source = parId.get(arete.source);
    const cible = parId.get(arete.cible);
    if (source && cible) aretes.push({ sorte: arete.sorte, source, cible });
  }

  // `d3-force` lit `link.source` et `link.target`, et ces noms ne se
  // configurent pas. On lui fournit donc un tableau à son format, qui partage
  // les mêmes objets de nœuds : la simulation les déplace, le tracé les suit.
  const liens = aretes.map((a) => ({ source: a.source, target: a.cible }));

  return { noeuds: [...parId.values()], aretes, liens, parId };
}

/**
 * La spirale de phyllotaxie, celle que `d3-force` utilise par défaut.
 *
 * Poser tous les nœuds en (0, 0) paraît anodin et ne l'est pas : à distance
 * nulle, la répulsion diverge et le graphe part à des milliers de pixels du
 * cadre. Un écart initial, même minime, suffit à ce que la simulation converge.
 */
function positionInitiale(index: number): { x: number; y: number } {
  const rayonSpirale = 10 * Math.sqrt(0.5 + index);
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  return { x: rayonSpirale * Math.cos(angle), y: rayonSpirale * Math.sin(angle) };
}

/** Le cadre qui contient tous les nœuds, marge comprise. */
export function cadrage(
  noeuds: NoeudPlace[],
  largeur: number,
  hauteur: number,
): { x: number; y: number; k: number } {
  if (noeuds.length === 0) return { x: largeur / 2, y: hauteur / 2, k: 1 };

  const xs = noeuds.map((n) => n.x);
  const ys = noeuds.map((n) => n.y);
  const minX = Math.min(...xs) - 40;
  const maxX = Math.max(...xs) + 40;
  const minY = Math.min(...ys) - 40;
  const maxY = Math.max(...ys) + 40;

  const k = Math.min(largeur / (maxX - minX), hauteur / (maxY - minY), 1.6);
  return {
    k,
    x: largeur / 2 - ((minX + maxX) / 2) * k,
    y: hauteur / 2 - ((minY + maxY) / 2) * k,
  };
}

function rayon(degre: number): number {
  return Math.min(RAYON_MAX, RAYON_MIN + Math.sqrt(degre) * 3);
}

/** Les voisins immédiats d'un nœud, pour l'estompage au survol. */
export function voisinage(aretes: ArtePlacee[], id: string): Set<string> {
  const trouves = new Set<string>([id]);
  for (const arete of aretes) {
    if (arete.source.id === id) trouves.add(arete.cible.id);
    if (arete.cible.id === id) trouves.add(arete.source.id);
  }
  return trouves;
}

export const SORTES: SorteNoeud[] = ["competence", "etape", "agent", "commande", "plugin"];

export const ETIQUETTE_SORTE: Record<SorteNoeud, string> = {
  competence: "compétences",
  etape: "étapes",
  agent: "agents",
  commande: "commandes",
  plugin: "plugins",
};

export interface Palette {
  parSorte: Record<SorteNoeud, string>;
  bord: string;
  encre: string;
  attenue: string;
  alerte: string;
  fond: string;
}

/** Lit les couleurs du thème en vigueur, pour que le canvas suive le mode sombre. */
export function lirePalette(element: HTMLElement): Palette {
  const style = getComputedStyle(element);
  const v = (nom: string) => style.getPropertyValue(`--color-${nom}`).trim() || "#888";
  return {
    parSorte: {
      competence: v("competence"),
      etape: v("etape"),
      agent: v("agent"),
      commande: v("commande"),
      plugin: v("plugin"),
    },
    bord: v("bord"),
    encre: v("encre"),
    attenue: v("attenue"),
    alerte: v("alerte"),
    fond: v("fond"),
  };
}
