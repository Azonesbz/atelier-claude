"use client";

import { useMemo, useState } from "react";
import { BLOC, mettreEnPlan, SATELLITE, type Lien } from "@/lib/plan";
import type { Workflow } from "@/lib/lecture/workflow";

/**
 * Le plan en SVG, avec mise en avant au survol.
 *
 * Survoler une étape éclaire ce qu'elle appelle ; survoler un sous-agent
 * éclaire les étapes qui l'appellent — le « utilisé par », qu'aucune lecture
 * du fichier ne donne d'un coup d'œil. Tout le reste s'estompe plutôt que de
 * disparaître : on garde le contexte.
 *
 * Le focus déclenche la même chose que le survol. Un plan qui ne se lit qu'à
 * la souris ne se lit pas au clavier, et les blocs sont déjà des cibles.
 */
/* 0,22 suffisait sur l'ancienne palette ; sur la charte noire — surface #111
   sur fond #0a0a0a — le texte estompé devenait illisible plutôt que
   recessif, et le plan semblait coupé net sous l'élément survolé. */
const ESTOMPE = 0.42;
/** Assez court pour suivre la souris, assez long pour que le fond ne clignote pas. */
const FONDU = "opacity 120ms ease, stroke-width 120ms ease";

export function PlanWorkflow({ workflow }: { workflow: Workflow }) {
  const plan = useMemo(() => mettreEnPlan(workflow), [workflow]);
  const [vise, setVise] = useState<string | null>(null);

  /** Les identités à garder vives : la cible et son voisinage direct. */
  const enAvant = useMemo(() => {
    if (!vise) return null;
    const bloc = plan.blocs.find((b) => b.id === vise);
    if (bloc) return new Set([bloc.id, ...bloc.appelle]);
    const satellite = plan.satellites.find((s) => s.id === vise);
    if (satellite) return new Set([satellite.id, ...satellite.appelePar]);
    return null;
  }, [vise, plan]);

  const vif = (id: string) => !enAvant || enAvant.has(id);
  const vifLien = (lien: Lien) =>
    !enAvant || (enAvant.has(lien.extremites[0]) && enAvant.has(lien.extremites[1]));

  return (
    <div className="card overflow-x-auto p-5">
      <svg
        viewBox={`-16 0 ${plan.largeur + 32} ${plan.hauteur}`}
        style={{ minWidth: plan.largeur + 32 }}
        className="h-auto"
        role="img"
        aria-label={`Plan du workflow : ${plan.blocs.length} étapes`}
        onMouseLeave={() => setVise(null)}
      >
        <defs>
          <marker id="pointe" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="fill-muted" />
          </marker>
        </defs>

        {/* Le fond rend la main. Sans lui, quitter un bloc pour la toile
            laissait la surbrillance collée : c'est ce qui donnait l'impression
            d'un bug. Il est premier, donc derrière tout le reste. */}
        <rect
          x={-16}
          y={0}
          width={plan.largeur + 32}
          height={plan.hauteur}
          fill="transparent"
          onMouseEnter={() => setVise(null)}
        />

        {plan.liens.map((lien, i) => (
          <Trait key={i} lien={lien} vif={vifLien(lien)} />
        ))}

        {plan.blocs.map(({ id, etape, x, y, depart, appelle }) => (
          <g
            key={id}
            tabIndex={0}
            role="listitem"
            aria-label={`Étape ${etape.numero} — ${etape.role}${appelle.length ? `, appelle ${appelle.length} élément(s)` : ""}`}
            style={{ opacity: vif(id) ? 1 : ESTOMPE, transition: FONDU }}
            className="cursor-default"
            onMouseEnter={() => setVise(id)}
            onFocus={() => setVise(id)}
            onBlur={() => setVise(null)}
          >
            {depart && (
              <text x={x + 10} y={y - 12} className="fill-ink-soft font-mono text-[11px]">
                ▸ point de départ
              </text>
            )}
            <rect
              x={x}
              y={y}
              width={BLOC.largeur}
              height={BLOC.hauteur}
              rx={8}
              className={`fill-paper ${etape.present ? "stroke-line" : "stroke-danger"}`}
              style={{ strokeWidth: vise === id || depart ? 2 : 1, transition: FONDU }}
            />
            <text x={x + 14} y={y + 24} className="fill-muted font-mono text-[13px]">
              {etape.numero}
            </text>
            <text x={x + 44} y={y + 24} className="fill-ink text-[13px] font-medium">
              {couper(etape.role, 42)}
            </text>
            <text x={x + 44} y={y + 44} className="fill-muted font-mono text-[11px]">
              {etape.fichierDeclare} · {etape.present ? `${etape.lignes} l.` : "fichier absent"}
            </text>
            {etape.arretDur && (
              <text
                x={x + BLOC.largeur - 14}
                y={y + 24}
                textAnchor="end"
                className="fill-danger font-mono text-[11px]"
              >
                arrêt dur
              </text>
            )}
          </g>
        ))}

        {plan.satellites.map((satellite) => (
          <g
            key={satellite.id}
            tabIndex={0}
            role="listitem"
            aria-label={`${satellite.nom}, utilisé par ${satellite.appelePar.length} étape(s)`}
            style={{ opacity: vif(satellite.id) ? 1 : ESTOMPE, transition: FONDU }}
            className="cursor-default"
            onMouseEnter={() => setVise(satellite.id)}
            onFocus={() => setVise(satellite.id)}
            onBlur={() => setVise(null)}
          >
            <rect
              x={satellite.x}
              y={satellite.y}
              width={SATELLITE.largeur}
              height={SATELLITE.hauteur}
              rx={16}
              style={{ strokeWidth: vise === satellite.id ? 2 : 1, transition: FONDU }}
              className={
                satellite.sorte === "agent"
                  ? "fill-ink-soft/15 stroke-ink-soft/40"
                  : "fill-muted/10 stroke-muted/40"
              }
            />
            <text
              x={satellite.x + 14}
              y={satellite.y + 21}
              className={`font-mono text-[12px] ${satellite.sorte === "agent" ? "fill-ink-soft" : "fill-muted"}`}
            >
              {satellite.sorte === "competence" ? `/${satellite.nom}` : satellite.nom}
            </text>
            {vise === satellite.id && (
              <text
                x={satellite.x + SATELLITE.largeur + 10}
                y={satellite.y + 21}
                className="fill-muted font-mono text-[11px]"
              >
                utilisé par {satellite.appelePar.length} étape
                {satellite.appelePar.length > 1 ? "s" : ""}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Trait({ lien, vif }: { lien: Lien; vif: boolean }) {
  const opacite = vif ? 1 : ESTOMPE;

  if (lien.sorte === "sequence") {
    return (
      <line
        x1={lien.de.x}
        y1={lien.de.y}
        x2={lien.vers.x}
        y2={lien.vers.y}
        style={{ opacity: opacite, transition: FONDU }}
        className="stroke-muted"
        strokeWidth={1.5}
        strokeDasharray={lien.confirme ? undefined : "4 4"}
        markerEnd="url(#pointe)"
      />
    );
  }

  const courbure = (lien.vers.x - lien.de.x) / 2;
  return (
    <path
      d={`M${lien.de.x},${lien.de.y} C${lien.de.x + courbure},${lien.de.y} ${lien.vers.x - courbure},${lien.vers.y} ${lien.vers.x},${lien.vers.y}`}
      style={{ opacity: opacite, strokeWidth: vif ? 1.5 : 1, transition: FONDU }}
      className="stroke-line"
      fill="none"
    />
  );
}

function couper(texte: string, maximum: number): string {
  return texte.length <= maximum ? texte : `${texte.slice(0, maximum - 1)}…`;
}
