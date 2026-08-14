"use client";

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
} from "d3-force";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Graphe, SorteNoeud } from "@/lib/lecture/graphe";
import { dessiner, noeudSous, type Vue } from "./dessin";
import {
  cadrage,
  ETIQUETTE_SORTE,
  lirePalette,
  preparer,
  SORTES,
  voisinage,
  type NoeudPlace,
} from "./modele";

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 4;

export function GrapheReseau({ graphe }: { graphe: Graphe }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const vue = useRef<Vue>({ x: 0, y: 0, k: 1 });
  const survole = useRef<NoeudPlace | null>(null);
  const attrape = useRef<NoeudPlace | null>(null);

  const [masquerIsoles, setMasquerIsoles] = useState(true);
  const [sortesVisibles, setSortesVisibles] = useState<Set<SorteNoeud>>(new Set(SORTES));
  const [selection, setSelection] = useState<NoeudPlace | null>(null);
  const recadrer = useRef<() => void>(() => {});
  const router = useRouter();

  const filtre = useMemo(() => {
    const noeuds = graphe.noeuds.filter((n) => sortesVisibles.has(n.sorte));
    const gardes = new Set(noeuds.map((n) => n.id));
    return {
      noeuds,
      aretes: graphe.aretes.filter((a) => gardes.has(a.source) && gardes.has(a.cible)),
    };
  }, [graphe, sortesVisibles]);

  const donnees = useMemo(() => preparer(filtre, masquerIsoles), [filtre, masquerIsoles]);

  useEffect(() => {
    const cadre = conteneur.current;
    const toile = canvas.current;
    if (!cadre || !toile) return;

    const palette = lirePalette(cadre);
    let largeur = cadre.clientWidth;
    let hauteur = cadre.clientHeight;

    const redimensionner = () => {
      largeur = cadre.clientWidth;
      hauteur = cadre.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      toile.width = largeur * ratio;
      toile.height = hauteur * ratio;
      toile.style.width = `${largeur}px`;
      toile.style.height = `${hauteur}px`;
      const ctx = toile.getContext("2d");
      if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    redimensionner();
    vue.current = cadrage(donnees.noeuds, largeur, hauteur);
    recadrer.current = () => {
      vue.current = cadrage(donnees.noeuds, largeur, hauteur);
      peindre();
    };

    const simulation: Simulation<NoeudPlace, undefined> = forceSimulation(donnees.noeuds)
      .force("lien", forceLink(donnees.liens).distance(70).strength(0.35))
      .force("repulsion", forceManyBody().strength(-180).distanceMax(600))
      .force("centre", forceCenter(0, 0).strength(0.04))
      .force("collision", forceCollide<NoeudPlace>().radius((n) => n.rayon + 6))
      .alphaDecay(0.02);

    const peindre = () => {
      const ctx = toile.getContext("2d");
      if (!ctx) return;
      const eclaires = survole.current ? voisinage(donnees.aretes, survole.current.id) : null;
      dessiner(ctx, largeur, hauteur, donnees.noeuds, donnees.aretes, vue.current, palette, eclaires);
    };
    simulation.on("tick", peindre);
    // Le graphe se déploie pendant les premières secondes : on le recadre une
    // fois qu'il a trouvé sa forme, sinon il déborde du cadre sans prévenir.
    simulation.on("end", () => {
      vue.current = cadrage(donnees.noeuds, largeur, hauteur);
      peindre();
    });

    const enGraphe = (evenement: PointerEvent | WheelEvent) => {
      const boite = toile.getBoundingClientRect();
      return { x: evenement.clientX - boite.left, y: evenement.clientY - boite.top };
    };

    let deplacementFond: { x: number; y: number } | null = null;

    const surPointerDown = (evenement: PointerEvent) => {
      const p = enGraphe(evenement);
      const cible = noeudSous(donnees.noeuds, p.x, p.y, vue.current);
      toile.setPointerCapture(evenement.pointerId);
      if (cible) {
        attrape.current = cible;
        simulation.alphaTarget(0.25).restart();
      } else {
        deplacementFond = { x: p.x - vue.current.x, y: p.y - vue.current.y };
      }
    };

    const surPointerMove = (evenement: PointerEvent) => {
      const p = enGraphe(evenement);
      if (attrape.current) {
        attrape.current.fx = (p.x - vue.current.x) / vue.current.k;
        attrape.current.fy = (p.y - vue.current.y) / vue.current.k;
        return;
      }
      if (deplacementFond) {
        vue.current = { ...vue.current, x: p.x - deplacementFond.x, y: p.y - deplacementFond.y };
        peindre();
        return;
      }
      const dessous = noeudSous(donnees.noeuds, p.x, p.y, vue.current);
      if (dessous !== survole.current) {
        survole.current = dessous;
        toile.style.cursor = dessous ? "pointer" : "grab";
        peindre();
      }
    };

    const surPointerUp = (evenement: PointerEvent) => {
      if (attrape.current) {
        const p = enGraphe(evenement);
        const bouge = noeudSous(donnees.noeuds, p.x, p.y, vue.current) === attrape.current;
        if (bouge) setSelection(attrape.current);
        attrape.current.fx = null;
        attrape.current.fy = null;
        attrape.current = null;
        simulation.alphaTarget(0);
      }
      deplacementFond = null;
    };

    const surWheel = (evenement: WheelEvent) => {
      evenement.preventDefault();
      const p = enGraphe(evenement);
      const facteur = Math.exp(-evenement.deltaY * 0.0015);
      const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, vue.current.k * facteur));
      const rapport = k / vue.current.k;
      vue.current = {
        k,
        x: p.x - (p.x - vue.current.x) * rapport,
        y: p.y - (p.y - vue.current.y) * rapport,
      };
      peindre();
    };

    toile.addEventListener("pointerdown", surPointerDown);
    toile.addEventListener("pointermove", surPointerMove);
    toile.addEventListener("pointerup", surPointerUp);
    toile.addEventListener("wheel", surWheel, { passive: false });
    window.addEventListener("resize", redimensionner);

    return () => {
      simulation.stop();
      toile.removeEventListener("pointerdown", surPointerDown);
      toile.removeEventListener("pointermove", surPointerMove);
      toile.removeEventListener("pointerup", surPointerUp);
      toile.removeEventListener("wheel", surWheel);
      window.removeEventListener("resize", redimensionner);
    };
  }, [donnees]);

  const basculer = (sorte: SorteNoeud) => {
    setSortesVisibles((precedent) => {
      const suite = new Set(precedent);
      if (suite.has(sorte)) suite.delete(sorte);
      else suite.add(sorte);
      return suite;
    });
  };

  return (
    <div className="relative h-[calc(100vh-11rem)] min-h-[420px] overflow-hidden rounded-lg border border-bord bg-carte">
      <div ref={conteneur} className="absolute inset-0">
        <canvas ref={canvas} className="block touch-none" style={{ cursor: "grab" }} />
      </div>

      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        {SORTES.map((sorte) => (
          <button
            key={sorte}
            type="button"
            onClick={() => basculer(sorte)}
            className={`flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[11px] ${
              sortesVisibles.has(sorte) ? "border-bord bg-fond" : "border-transparent opacity-40"
            }`}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: `var(--color-${sorte})` }}
            />
            {ETIQUETTE_SORTE[sorte]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => recadrer.current()}
          className="rounded border border-bord bg-fond px-2 py-1 font-mono text-[11px]"
        >
          recadrer
        </button>
        <button
          type="button"
          onClick={() => setMasquerIsoles((v) => !v)}
          className={`rounded border px-2 py-1 font-mono text-[11px] ${
            masquerIsoles ? "border-bord bg-fond" : "border-transparent opacity-40"
          }`}
        >
          masquer les isolés
        </button>
      </div>

      <p className="absolute right-3 bottom-3 font-mono text-[11px] text-attenue">
        {donnees.noeuds.length} nœuds · {donnees.aretes.length} liens
      </p>

      {selection && (
        <aside className="absolute top-3 right-3 w-72 rounded-lg border border-bord bg-fond p-3 text-sm shadow-lg">
          <div className="flex items-baseline justify-between gap-2">
            <strong className="min-w-0 truncate">{selection.etiquette}</strong>
            <button type="button" onClick={() => setSelection(null)} className="text-attenue">
              ✕
            </button>
          </div>
          <p className="mt-1 font-mono text-[11px] text-attenue">
            {ETIQUETTE_SORTE[selection.sorte]} · {selection.origine} · {selection.degre} lien
            {selection.degre > 1 ? "s" : ""}
          </p>
          <p className="mt-2 font-mono text-[11px] break-all text-attenue">{selection.chemin}</p>
          {selection.lien && (
            <button
              type="button"
              onClick={() => router.push(selection.lien as never)}
              className="mt-3 w-full rounded bg-encre px-3 py-1.5 text-xs font-medium text-fond"
            >
              ouvrir la fiche
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
