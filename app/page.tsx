import { ChoixProjet } from "@/components/ChoixProjet";
import Link from "next/link";
import { lireAtelier } from "@/lib/lecture/atelier";
import { lireChoix } from "@/lib/lecture/choix";
import { listerProjetsConnus } from "@/lib/lecture/projets";
import { lireVeille } from "@/lib/lecture/veille";
import { aDesEtapes } from "@/lib/lecture/workflow";

export const dynamic = "force-dynamic";

export default function Accueil() {
  const atelier = lireAtelier();
  const veille = lireVeille();
  const projetsConnus = listerProjetsConnus();
  const sansEffet = compterSansEffet(atelier);
  const lus =
    atelier.competences.length + atelier.agents.length + atelier.commandes.length +
    atelier.hooks.length + atelier.plugins.length;

  return (
    <main>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Atelier Claude</h1>
        <p className="mt-2 max-w-prose text-sm text-attenue">
          Cette page lit ton dossier <code>.claude</code> et cherche une seule chose : ce qui est{" "}
          <strong className="font-semibold text-encre">présent mais sans effet</strong> — un plugin
          déclaré dont le code a disparu, un agent sans description, un en-tête que Claude Code
          n&apos;arrive pas à lire. Rien n&apos;est deviné : chaque signalement vient d&apos;une
          règle vérifiable, écrite en rouge sous la ligne concernée.
        </p>

        <dl className="mt-4 grid gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-[auto_1fr]">
          <dt className="text-attenue">Réglages personnels</dt>
          <dd className="truncate">{atelier.racineUtilisateur}</dd>
          <dt className="text-attenue">Projet lu</dt>
          <dd className="truncate">
            {atelier.racineProjet ?? (
              <span className="text-alerte">aucun — choisis-en un ci-dessous</span>
            )}
          </dd>
        </dl>

        <ChoixProjet
          connus={projetsConnus}
          actuel={lireChoix()}
          impose={process.env.ATELIER_PROJET ?? null}
        />

        <p className="mt-4 text-sm">
          {lus === 0 ? (
            <span className="text-alerte">
              Rien n&apos;a été lu. Vérifie que {atelier.racineUtilisateur} existe.
            </span>
          ) : sansEffet === 0 ? (
            <span className="text-calme">
              Tout ce qui est déclaré charge réellement. Les workflows se vérifient sur leur propre
              page.
            </span>
          ) : (
            <span className="text-alerte">
              {sansEffet} élément{sansEffet > 1 ? "s" : ""} présent{sansEffet > 1 ? "s" : ""} mais
              sans effet — détail sous la ligne concernée.
            </span>
          )}
        </p>
      </header>

      <nav className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["/competences", "Compétences", atelier.competences.length],
          ["/workflows", "Workflows", atelier.competences.filter((c) => aDesEtapes(c.corps)).length],
          ["/agents", "Agents et commandes", atelier.agents.length + atelier.commandes.length],
          ["/reglages", "Réglages", atelier.hooks.length + atelier.permissions.length + atelier.plugins.length],
          ["/veille", "Veille au démarrage", veille.installe ? "en place" : "à installer"],
        ].map(([href, titre, compte]) => (
          <Link
            key={href as string}
            href={href as string}
            className="rounded-lg border border-bord bg-carte px-4 py-3 hover:border-encre"
          >
            <span className="block text-sm font-medium">{titre}</span>
            <span className="font-mono text-[11px] text-attenue">{compte}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

/**
 * Les éléments présents mais sans effet.
 *
 * Ne compte pas les étapes mortes d'un workflow : elles se lisent sur la page du
 * plan, et le résumé le dit plutôt que de laisser croire qu'il a tout regardé.
 */
function compterSansEffet(atelier: ReturnType<typeof lireAtelier>): number {
  return [atelier.competences, atelier.agents, atelier.commandes, atelier.hooks, atelier.plugins]
    .flat()
    .filter((e) => e.silences.length > 0).length;
}
