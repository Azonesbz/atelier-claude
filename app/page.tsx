import { ChoixProjet } from "@/components/ChoixProjet";
import { TableauDeBord } from "@/components/TableauDeBord";
import { resumer } from "@/lib/resume";
import { lireAtelier } from "@/lib/lecture/atelier";
import { lireChoix } from "@/lib/lecture/choix";
import { listerProjetsConnus } from "@/lib/lecture/projets";
import { lireVeille } from "@/lib/lecture/veille";

export const dynamic = "force-dynamic";

export default function Accueil() {
  const atelier = lireAtelier();
  const veille = lireVeille();

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

      <TableauDeBord
        avec={resumer(atelier, true)}
        sans={resumer(atelier, false)}
        racineUtilisateur={atelier.racineUtilisateur}
        veilleInstallee={veille.installe}
      />
    </main>
  );
}
