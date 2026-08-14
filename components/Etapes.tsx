import type { EtapeWorkflow } from "@/lib/lecture/workflow";
import { Silences } from "./primitives";

/**
 * Le déroulé, de haut en bas.
 *
 * Pas de boîtes ni de flèches libres : la séquence est linéaire dans le
 * fichier, elle le reste à l'écran. Dessiner un graphe suggérerait des
 * branchements que Claude Code n'exécute pas.
 */
export function Etapes({ etapes }: { etapes: EtapeWorkflow[] }) {
  return (
    <ol className="relative">
      <span aria-hidden className="absolute top-4 bottom-4 left-[15px] w-px bg-bord" />
      {etapes.map((etape) => (
        <Etape key={etape.numero + etape.fichierDeclare} etape={etape} />
      ))}
    </ol>
  );
}

function Etape({ etape }: { etape: EtapeWorkflow }) {
  return (
    <li className="relative mb-3 flex gap-4">
      <span
        className={`z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${
          etape.present ? "border-bord bg-carte text-attenue" : "border-alerte bg-alerte-fond text-alerte"
        }`}
      >
        {etape.numero}
      </span>

      <div className="min-w-0 flex-1 rounded-lg border border-bord bg-carte px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-medium">{etape.role}</span>
          {etape.arretDur && (
            <span className="rounded bg-alerte/10 px-1.5 py-0.5 font-mono text-[11px] text-alerte">
              arrêt dur
            </span>
          )}
          <span className="ml-auto font-mono text-[11px] text-attenue">
            {etape.present ? `${etape.lignes} l.` : "fichier absent"}
          </span>
        </div>

        <p className="mt-1 font-mono text-[11px] text-attenue">{etape.fichierDeclare}</p>

        {(etape.agents.length > 0 || etape.competences.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-attenue">délègue à</span>
            {etape.agents.map((nom) => (
              <Jeton key={nom} sorte="agent" nom={nom} />
            ))}
            {etape.competences.map((nom) => (
              <Jeton key={nom} sorte="compétence" nom={nom} />
            ))}
          </div>
        )}

        <Silences silences={etape.silences} />
      </div>
    </li>
  );
}

function Jeton({ sorte, nom }: { sorte: "agent" | "compétence"; nom: string }) {
  const style =
    sorte === "agent" ? "bg-calme/15 text-calme" : "bg-attenue/15 text-attenue";
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${style}`} title={sorte}>
      {sorte === "compétence" ? `/${nom}` : nom}
    </span>
  );
}
