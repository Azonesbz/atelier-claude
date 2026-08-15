import type { Veille as EtatVeille } from "@/lib/lecture/veille";

/**
 * Le hook de veille, avec le bloc calculé pour CETTE machine.
 *
 * Le chemin était écrit à la main dans le README : juste chez son auteur, faux
 * chez tout le monde. On ne demande jamais de remplacer un SessionStart
 * existant — il appartient peut-être à un autre outil.
 */
export function Veille({ veille }: { veille: EtatVeille }) {
  return (
    <section id="veille" className="mb-10 scroll-mt-4">
      <h2 className="mb-2 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-2 text-sm font-semibold tracking-wide uppercase">
        Veille au démarrage
        <span
          className={`font-mono text-xs font-normal ${veille.installe ? "text-ink-soft" : "text-muted"}`}
        >
          {veille.installe ? "en place" : "pas installée"}
        </span>
      </h2>

      <p className="mb-3 max-w-prose text-xs text-muted">
        Un plugin mort ne charge pas ses propres hooks : il ne peut donc pas signaler sa mort. Ce
        petit script vit à l&apos;écart et te prévient au démarrage d&apos;une session, uniquement
        s&apos;il trouve un écart. Le reste du temps, il se tait.
      </p>

      {veille.installe ? (
        <p className="text-sm text-ink-soft">
          Déclarée dans <code className="font-mono text-xs">{veille.fichierReglages}</code>.
        </p>
      ) : (
        <div className="card p-5">
          <p className="mb-2 text-sm">
            {veille.autreHookPresent ? (
              <>
                Un <code>SessionStart</code> existe déjà dans{" "}
                <code className="font-mono text-xs">{veille.fichierReglages}</code> et appartient à
                autre chose.{" "}
                <strong className="font-semibold">Fusionne le tableau, ne le remplace pas.</strong>
              </>
            ) : (
              <>
                À coller dans <code className="font-mono text-xs">{veille.fichierReglages}</code>.
              </>
            )}
          </p>
          <pre className="overflow-x-auto rounded border border-line p-3 font-mono text-[11px] leading-relaxed">
            {veille.bloc}
          </pre>
        </div>
      )}
    </section>
  );
}
