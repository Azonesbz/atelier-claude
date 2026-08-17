/**
 * Le bandeau de compatibilité, juste après le héros.
 *
 * L'objection qui vient en premier sur un outil de diagnostic n'est pas le
 * prix, c'est « il va falloir le configurer ». On y répond en montrant les
 * chemins eux-mêmes : ce sont ceux que le lecteur connaît déjà, il vérifie d'un
 * coup d'œil qu'il n'y a rien à brancher.
 *
 * La version du binaire est datée volontairement. Un outil qui lit des fichiers
 * de configuration vieillit avec eux ; annoncer sur quoi il a été vérifié coûte
 * moins cher que de laisser croire à une compatibilité éternelle.
 */

/** Les fichiers réellement ouverts. La glose n'existe que quand le chemin seul ment. */
const LUS: Array<{ chemin: string; glose?: string }> = [
  { chemin: "~/.claude/settings.json" },
  { chemin: "~/.claude/plugins/installed_plugins.json" },
  { chemin: "~/.claude/plugins/cache/" },
  { chemin: ".claude/", glose: "du projet" },
  { chemin: "cwd", glose: "le champ des transcriptions" },
];

const INVENTORIE = [
  "compétences",
  "agents",
  "commandes",
  "hooks",
  "règles de permission",
  "plugins",
  "fichiers d'instructions",
];

export function Compatibilite() {
  return (
    <section id="compatibilite" className="card mt-12 scroll-mt-4 p-5 sm:mt-16 sm:p-6">
      <h2 className="text-xl font-semibold text-balance sm:text-2xl">
        Il lit ce que Claude Code lit.
      </h2>
      <p className="mt-3 max-w-2xl text-base text-ink-soft">
        Aucune configuration. Orcha ouvre les mêmes fichiers que ton binaire, au même endroit.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="surtitre mb-2 border-b border-line pb-2">Les fichiers réellement lus</p>
          <ul>
            {LUS.map((fichier) => (
              <li
                key={fichier.chemin}
                className="flex flex-wrap items-baseline gap-x-2 border-b border-line py-1.5 last:border-0"
              >
                <span className="font-mono text-xs text-ink-soft">{fichier.chemin}</span>
                {fichier.glose && <span className="text-xs text-muted">{fichier.glose}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="surtitre mb-2 border-b border-line pb-2">Ce qu&apos;il inventorie</p>
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {INVENTORIE.map((element) => (
              <li key={element} className="chip">
                {element}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 border-t border-line pt-4 font-mono text-xs text-muted">
        Vérifié sur Claude Code 2.1.227.
      </p>
    </section>
  );
}
