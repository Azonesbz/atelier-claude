import { Inventaire } from "@/components/Inventaire";
import { Veille } from "@/components/Veille";
import { lireAtelier } from "@/lib/lecture/atelier";
import { lireVeille } from "@/lib/lecture/veille";
import { aDesEtapes } from "@/lib/lecture/workflow";

export const dynamic = "force-dynamic";

export default function Accueil() {
  const atelier = lireAtelier();
  const veille = lireVeille();
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
              <span className="text-alerte">
                aucun — définis ATELIER_PROJET, ou lance l&apos;outil depuis ton projet
              </span>
            )}
          </dd>
        </dl>

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

      <Inventaire
        atelier={atelier}
        aDesEtapes={atelier.competences.filter((c) => aDesEtapes(c.corps)).map((c) => c.chemin)}
      />

      <Veille veille={veille} />
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
