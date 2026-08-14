import { BLOC, mettreEnPlan, SATELLITE, type Lien } from "@/lib/plan";
import type { Workflow } from "@/lib/lecture/workflow";

/**
 * Le plan en SVG. Une quinzaine de blocs porteurs de texte : le DOM suffit
 * largement, et le texte reste sélectionnable, cherchable, accessible.
 */
export function PlanWorkflow({ workflow }: { workflow: Workflow }) {
  const plan = mettreEnPlan(workflow);

  return (
    <div className="overflow-x-auto rounded-lg border border-bord bg-carte p-4">
      <svg
        viewBox={`-16 0 ${plan.largeur + 32} ${plan.hauteur}`}
        width={plan.largeur + 32}
        className="h-auto max-w-full"
        role="img"
        aria-label={`Plan du workflow : ${plan.blocs.length} étapes`}
      >
        <defs>
          <marker id="pointe" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="fill-attenue" />
          </marker>
        </defs>

        {plan.liens.map((lien, i) => (
          <Trait key={i} lien={lien} />
        ))}

        {plan.blocs.map(({ etape, x, y, depart }) => (
          <g key={etape.numero + etape.fichierDeclare}>
            {depart && (
              <text x={x + 10} y={y - 12} className="fill-calme font-mono text-[11px]">
                ▸ point de départ
              </text>
            )}
            <rect
              x={x}
              y={y}
              width={BLOC.largeur}
              height={BLOC.hauteur}
              rx={8}
              className={`fill-fond ${etape.present ? "stroke-bord" : "stroke-alerte"}`}
              strokeWidth={depart ? 2 : 1}
            />
            <text x={x + 14} y={y + 24} className="fill-attenue font-mono text-[13px]">
              {etape.numero}
            </text>
            <text x={x + 44} y={y + 24} className="fill-encre text-[13px] font-medium">
              {couper(etape.role, 42)}
            </text>
            <text x={x + 44} y={y + 44} className="fill-attenue font-mono text-[11px]">
              {etape.fichierDeclare} · {etape.present ? `${etape.lignes} l.` : "fichier absent"}
            </text>
            {etape.arretDur && (
              <text x={x + BLOC.largeur - 14} y={y + 24} textAnchor="end" className="fill-alerte font-mono text-[11px]">
                arrêt dur
              </text>
            )}
          </g>
        ))}

        {plan.satellites.map((satellite) => (
          <g key={satellite.id}>
            <rect
              x={satellite.x}
              y={satellite.y}
              width={SATELLITE.largeur}
              height={SATELLITE.hauteur}
              rx={16}
              className={satellite.sorte === "agent" ? "fill-calme/15 stroke-calme/40" : "fill-attenue/10 stroke-attenue/40"}
            />
            <text
              x={satellite.x + 14}
              y={satellite.y + 21}
              className={`font-mono text-[12px] ${satellite.sorte === "agent" ? "fill-calme" : "fill-attenue"}`}
            >
              {satellite.sorte === "competence" ? `/${satellite.nom}` : satellite.nom}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Trait({ lien }: { lien: Lien }) {
  if (lien.sorte === "sequence") {
    return (
      <line
        x1={lien.de.x}
        y1={lien.de.y}
        x2={lien.vers.x}
        y2={lien.vers.y}
        className="stroke-attenue"
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
      className="stroke-bord"
      strokeWidth={1}
      fill="none"
    />
  );
}

function couper(texte: string, maximum: number): string {
  return texte.length <= maximum ? texte : `${texte.slice(0, maximum - 1)}…`;
}
