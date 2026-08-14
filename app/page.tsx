import Link from "next/link";
import { Ligne, Liste, Panneau, Pastille, Silences } from "@/components/primitives";
import { lireAtelier } from "@/lib/lecture/atelier";
import { aDesEtapes } from "@/lib/lecture/workflow";

export const dynamic = "force-dynamic";

export default function Accueil() {
  const atelier = lireAtelier();
  const ecarts = compterEcarts(atelier);

  return (
    <main>
      <header className="mb-10">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold">Atelier Claude</h1>
          <Link href="/graphe" className="text-sm underline underline-offset-2">
            voir le réseau →
          </Link>
        </div>
        <p className="mt-1 text-sm text-attenue">
          {atelier.racineUtilisateur}
          {atelier.racineProjet ? ` · ${atelier.racineProjet}` : " · aucun projet"}
        </p>
        <p className="mt-3 text-sm">
          {ecarts === 0 ? (
            <span className="text-calme">
              Tout ce qui est déclaré est présent sur le disque.
            </span>
          ) : (
            <span className="text-alerte">
              {ecarts} élément{ecarts > 1 ? "s" : ""} présent{ecarts > 1 ? "s" : ""} mais sans effet, ou
              nommé{ecarts > 1 ? "s" : ""} de travers.
            </span>
          )}
        </p>
      </header>

      <Panneau titre="Compétences" compte={atelier.competences.length} ecarts={avecSilence(atelier.competences)}>
        <Liste>
          {atelier.competences.map((c) => (
            <Ligne key={c.chemin}>
              <Link href={`/competence/${encodeURIComponent(c.chemin)}`} className="font-medium underline-offset-2 hover:underline">
                {c.nom}
              </Link>
              <Pastille portee={c.portee} origine={c.origine} />
              {aDesEtapes(c.corps) && (
                <Link
                  href={`/workflow/${encodeURIComponent(c.chemin)}`}
                  className="rounded bg-calme/15 px-1.5 py-0.5 font-mono text-[11px] text-calme underline-offset-2 hover:underline"
                >
                  workflow
                </Link>
              )}
              {!c.invocableParLeModele && (
                <span className="font-mono text-[11px] text-attenue">invisible du modèle</span>
              )}
              <span className="min-w-0 flex-1 truncate text-xs text-attenue">{c.description}</span>
              <span className="font-mono text-[11px] text-attenue">{c.lignes} l.</span>
              <div className="w-full"><Silences silences={c.silences} /></div>
            </Ligne>
          ))}
        </Liste>
      </Panneau>

      <Panneau titre="Plugins" compte={atelier.plugins.length} ecarts={avecSilence(atelier.plugins)}>
        <Liste>
          {atelier.plugins.map((p) => (
            <Ligne key={p.identifiant + p.cheminInstallation}>
              <span className="font-medium">{p.identifiant}</span>
              <span className={`font-mono text-[11px] ${p.present ? "text-calme" : "text-alerte"}`}>
                {p.present ? "présent" : "absent du disque"}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-attenue">
                {p.cheminInstallation}
              </span>
              <div className="w-full"><Silences silences={p.silences} /></div>
            </Ligne>
          ))}
        </Liste>
      </Panneau>

      <Panneau titre="Agents" compte={atelier.agents.length} ecarts={avecSilence(atelier.agents)}>
        <Liste>
          {atelier.agents.map((a) => (
            <Ligne key={a.chemin}>
              <span className="font-medium">{a.nom}</span>
              <Pastille portee={a.portee} origine={a.origine} />
              <span className="min-w-0 flex-1 truncate text-xs text-attenue">{a.description}</span>
              <div className="w-full"><Silences silences={a.silences} /></div>
            </Ligne>
          ))}
        </Liste>
      </Panneau>

      <Panneau titre="Commandes" compte={atelier.commandes.length} ecarts={avecSilence(atelier.commandes)}>
        <Liste>
          {atelier.commandes.map((c) => (
            <Ligne key={c.chemin}>
              <span className="font-mono font-medium">/{c.nom}</span>
              <Pastille portee={c.portee} origine={c.origine} />
              <span className="min-w-0 flex-1 truncate text-xs text-attenue">{c.description}</span>
              <div className="w-full"><Silences silences={c.silences} /></div>
            </Ligne>
          ))}
        </Liste>
      </Panneau>

      <Panneau titre="Hooks" compte={atelier.hooks.length} ecarts={avecSilence(atelier.hooks)}>
        <Liste>
          {atelier.hooks.map((h, i) => (
            <Ligne key={i}>
              <span className="font-medium">{h.evenement}</span>
              <Pastille portee={h.portee} origine={h.origine} />
              {h.matcher && <span className="font-mono text-[11px] text-attenue">{h.matcher}</span>}
              <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{h.commande}</span>
              <div className="w-full"><Silences silences={h.silences} /></div>
            </Ligne>
          ))}
        </Liste>
      </Panneau>

      <Panneau titre="Permissions" compte={atelier.permissions.length}>
        <Liste>
          {atelier.permissions.map((r, i) => (
            <Ligne key={i}>
              <span
                className={`font-mono text-[11px] ${r.decision === "deny" ? "text-alerte" : "text-attenue"}`}
              >
                {r.decision}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{r.motif}</span>
              <Pastille portee={r.portee} origine={r.origine} />
            </Ligne>
          ))}
        </Liste>
      </Panneau>

      <Panneau titre="Instructions" compte={atelier.instructions.length}>
        <Liste>
          {atelier.instructions.map((f) => (
            <Ligne key={f.chemin}>
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.chemin}</span>
              <Pastille portee={f.portee} origine={f.portee === "projet" ? "projet" : "~/.claude"} />
              <span className="font-mono text-[11px] text-attenue">{f.lignes} l. · {f.octets} o.</span>
            </Ligne>
          ))}
        </Liste>
      </Panneau>
    </main>
  );
}

function avecSilence(liste: Array<{ silences: unknown[] }>): number {
  return liste.filter((e) => e.silences.length > 0).length;
}

function compterEcarts(atelier: ReturnType<typeof lireAtelier>): number {
  return [atelier.competences, atelier.agents, atelier.commandes, atelier.hooks, atelier.plugins]
    .flat()
    .filter((e) => e.silences.length > 0).length;
}
