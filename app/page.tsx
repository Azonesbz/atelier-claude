import { ChoixProjet } from "@/components/ChoixProjet";
import { Ecarts, RepartitionPortee, Tuile, type Part } from "@/components/tableau-de-bord";
import { lireAtelier } from "@/lib/lecture/atelier";
import { lireChoix } from "@/lib/lecture/choix";
import { listerProjetsConnus } from "@/lib/lecture/projets";
import { lireVeille } from "@/lib/lecture/veille";
import { aDesEtapes, lireWorkflow } from "@/lib/lecture/workflow";
import type { Atelier } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function Accueil() {
  const atelier = lireAtelier();
  const veille = lireVeille();
  const ecarts = releverLesEcarts(atelier);
  const workflows = compterLesWorkflows(atelier);
  const lus = atelier.competences.length + atelier.agents.length + atelier.commandes.length;

  return (
    <main>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Vue d&apos;ensemble</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Ce qui charge réellement dans tes sessions, et ce qui est présent mais sans effet.
        </p>
      </header>

      {/* La ligne de contexte : ce qui est lu, et de quel projet. */}
      <section className="card mb-6 px-4 py-3.5">
        <dl className="grid gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">Réglages personnels</dt>
          <dd className="truncate">{atelier.racineUtilisateur}</dd>
          <dt className="text-muted">Projet lu</dt>
          <dd className="truncate">
            {atelier.racineProjet ?? (
              <span className="text-danger">aucun — choisis-en un ci-dessous</span>
            )}
          </dd>
        </dl>
        <ChoixProjet
          connus={listerProjetsConnus()}
          actuel={lireChoix()}
          impose={process.env.ATELIER_PROJET ?? null}
        />
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile
          titre="Sans effet"
          valeur={ecarts.length}
          precision={ecarts.length === 0 ? "rien à corriger" : "détail ci-dessous"}
          alerte={ecarts.length > 0}
        />
        <Tuile
          titre="Compétences"
          valeur={atelier.competences.length}
          precision={`dont ${atelier.competences.filter((c) => !c.invocableParLeModele).length} lancées à la main`}
          href="/competences"
        />
        <Tuile
          titre="Workflows"
          valeur={workflows.total}
          precision={`${workflows.etapes} étapes, ${workflows.arrets} arrêts durs`}
          href="/workflows"
        />
        <Tuile
          titre="Agents et commandes"
          valeur={atelier.agents.length + atelier.commandes.length}
          precision={`${atelier.agents.length} agents · ${atelier.commandes.length} commandes`}
          href="/agents"
        />
        <Tuile
          titre="Plugins actifs"
          valeur={atelier.plugins.filter((p) => p.active && p.present).length}
          precision={`${atelier.catalogue.length} au catalogue, non activés`}
          href="/reglages"
        />
        <Tuile
          titre="Permissions"
          valeur={atelier.permissions.length}
          precision={`${atelier.permissions.filter((r) => r.decision === "deny").length} deny · ${atelier.permissions.filter((r) => r.decision === "ask").length} ask`}
          href="/reglages"
        />
        <Tuile
          titre="Hooks"
          valeur={atelier.hooks.length}
          precision="lancés automatiquement"
          href="/reglages"
        />
        <Tuile
          titre="Veille"
          valeur={veille.installe ? "en place" : "absente"}
          precision={veille.installe ? "prévient au démarrage" : "à installer"}
          href="/veille"
          alerte={!veille.installe}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Ecarts lignes={ecarts} />
        <RepartitionPortee parts={repartir(atelier, lus)} />
      </div>
    </main>
  );
}

/** Les portées, de la plus proche à la plus lointaine — l'ordre fait l'échelle. */
function repartir(atelier: Atelier, total: number): Part[] {
  const compter = (portee: string) =>
    [atelier.competences, atelier.agents, atelier.commandes]
      .flat()
      .filter((e) => e.portee === portee).length;

  return [
    { nom: "Ce projet", compte: compter("projet"), detail: atelier.racineProjet ?? "aucun projet lu" },
    { nom: "Toi", compte: compter("utilisateur"), detail: atelier.racineUtilisateur },
    {
      nom: "Plugins",
      compte: compter("plugin"),
      detail: `${atelier.plugins.filter((p) => p.active).length} plugin(s) activé(s)`,
    },
  ].filter(() => total > 0);
}

/** Tout ce qui est présent mais sans effet, workflows compris. */
function releverLesEcarts(atelier: Atelier) {
  const resolveur = {
    agents: atelier.agents.map((a) => a.nom),
    competences: atelier.competences.map((c) => c.nom),
  };

  const directs = [
    ...atelier.competences.map((c) => ({ e: c, quoi: c.nom, ou: c.chemin, href: `/competences` })),
    ...atelier.agents.map((a) => ({ e: a, quoi: a.nom, ou: a.chemin, href: `/agents` })),
    ...atelier.commandes.map((c) => ({ e: c, quoi: `/${c.nom}`, ou: c.chemin, href: `/agents` })),
    ...atelier.plugins.map((p) => ({ e: p, quoi: p.identifiant, ou: p.cheminInstallation, href: `/reglages` })),
    ...atelier.hooks.map((h) => ({ e: h, quoi: h.evenement, ou: h.commande, href: `/reglages` })),
  ].flatMap(({ e, quoi, ou, href }) => e.silences.map((s) => ({ quoi, cause: s.cause, ou, href })));

  // Les étapes mortes d'un workflow : le résumé les ignorait, et pouvait donc
  // annoncer « tout va bien » avec une étape qui ne s'exécutera jamais.
  const desWorkflows = atelier.competences.flatMap((c) => {
    const workflow = aDesEtapes(c.corps) ? lireWorkflow(c.chemin, c.corps, resolveur) : null;
    return (workflow?.etapes ?? []).flatMap((etape) =>
      etape.silences.map((s) => ({
        quoi: `${c.nom} · étape ${etape.numero}`,
        cause: s.cause,
        ou: etape.fichierDeclare,
        href: `/workflow/${encodeURIComponent(c.chemin)}`,
      })),
    );
  });

  return [...directs, ...desWorkflows];
}

function compterLesWorkflows(atelier: Atelier) {
  const resolveur = {
    agents: atelier.agents.map((a) => a.nom),
    competences: atelier.competences.map((c) => c.nom),
  };
  const trouves = atelier.competences
    .filter((c) => aDesEtapes(c.corps))
    .map((c) => lireWorkflow(c.chemin, c.corps, resolveur))
    .filter((w): w is NonNullable<typeof w> => w !== null);

  return {
    total: trouves.length,
    etapes: trouves.reduce((n, w) => n + w.etapes.length, 0),
    arrets: trouves.reduce((n, w) => n + w.etapes.filter((e) => e.arretDur).length, 0),
  };
}
