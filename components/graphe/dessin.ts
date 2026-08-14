/**
 * Le rendu sur canvas. Aucune logique de simulation ici, seulement du tracé.
 *
 * Canvas plutôt que SVG : cent-vingt nœuds en mouvement continu, c'est cent-vingt
 * éléments du DOM à repositionner soixante fois par seconde. Le canvas s'en moque.
 */

import type { ArtePlacee, NoeudPlace, Palette } from "./modele";

export interface Vue {
  x: number;
  y: number;
  k: number;
}

const SEUIL_ETIQUETTES = 0.75;
const OPACITE_ESTOMPEE = 0.12;

export function dessiner(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  hauteur: number,
  noeuds: NoeudPlace[],
  aretes: ArtePlacee[],
  vue: Vue,
  palette: Palette,
  eclaires: Set<string> | null,
) {
  ctx.save();
  ctx.clearRect(0, 0, largeur, hauteur);
  ctx.translate(vue.x, vue.y);
  ctx.scale(vue.k, vue.k);

  for (const arete of aretes) {
    const vif = !eclaires || (eclaires.has(arete.source.id) && eclaires.has(arete.cible.id));
    ctx.globalAlpha = vif ? 0.55 : OPACITE_ESTOMPEE;
    ctx.strokeStyle = arete.sorte === "sequence" ? palette.encre : palette.attenue;
    ctx.lineWidth = (arete.sorte === "sequence" ? 1.4 : 0.8) / vue.k;
    ctx.beginPath();
    ctx.moveTo(arete.source.x, arete.source.y);
    ctx.lineTo(arete.cible.x, arete.cible.y);
    ctx.stroke();
  }

  for (const noeud of noeuds) {
    const vif = !eclaires || eclaires.has(noeud.id);
    ctx.globalAlpha = vif ? 1 : OPACITE_ESTOMPEE;

    ctx.beginPath();
    ctx.arc(noeud.x, noeud.y, noeud.rayon, 0, Math.PI * 2);
    ctx.fillStyle = palette.parSorte[noeud.sorte];
    ctx.fill();

    if (noeud.enSilence) {
      ctx.strokeStyle = palette.alerte;
      ctx.lineWidth = 2 / vue.k;
      ctx.stroke();
    }
  }

  if (vue.k >= SEUIL_ETIQUETTES) {
    ctx.font = `${11 / vue.k}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const noeud of noeuds) {
      const vif = !eclaires || eclaires.has(noeud.id);
      ctx.globalAlpha = vif ? 0.9 : OPACITE_ESTOMPEE;
      ctx.fillStyle = palette.encre;
      ctx.fillText(noeud.etiquette, noeud.x, noeud.y + noeud.rayon + 3 / vue.k);
    }
  }

  ctx.restore();
}

/** Le nœud sous le pointeur, ou null. Les gros passent devant les petits. */
export function noeudSous(
  noeuds: NoeudPlace[],
  clientX: number,
  clientY: number,
  vue: Vue,
): NoeudPlace | null {
  const x = (clientX - vue.x) / vue.k;
  const y = (clientY - vue.y) / vue.k;

  let trouve: NoeudPlace | null = null;
  for (const noeud of noeuds) {
    const marge = noeud.rayon + 4 / vue.k;
    const dx = noeud.x - x;
    const dy = noeud.y - y;
    if (dx * dx + dy * dy <= marge * marge) {
      if (!trouve || noeud.rayon > trouve.rayon) trouve = noeud;
    }
  }
  return trouve;
}
