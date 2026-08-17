import { ARemplir, ChampARemplir } from "./ARemplir";

/**
 * L'auteur — la seule preuve sociale disponible, et elle est vide.
 *
 * Le produit n'a aucun acheteur : témoignages, logos et compteurs sont donc
 * interdits, et rien ne les remplacera par un ersatz. Ce qui reste tenable,
 * c'est une personne responsable en face d'un outil qui écrit dans
 * `~/.claude` — le panel montre que l'anonymat s'y paie plus cher qu'ailleurs.
 *
 * La section est donc construite mais pas remplie : ni nom autorisé à
 * l'affichage, ni canal de contact validé. Elle reste visible avec ses champs
 * marqués, parce qu'un trou qui se voit se comble ; un trou masqué se publie.
 */

export function Auteur() {
  return (
    <section className="mt-20">
      <h2 className="surtitre">// L&apos;AUTEUR</h2>

      <div className="mt-5">
        <ARemplir quoi="identité de l'auteur">
          <p className="max-w-prose">
            Rien n&apos;est publié sans accord. Quatre champs à arbitrer avant la mise en ligne —
            aucun ne peut être deviné à la place de l&apos;intéressé.
          </p>

          <div className="flex flex-wrap items-start gap-5 pt-1">
            <div className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong text-center">
              <span className="text-xs text-ink-soft">Portrait</span>
              <span className="font-mono text-xs text-amber">à remplir</span>
            </div>

            <div className="min-w-0 space-y-2">
              <ChampARemplir intitule="Nom affiché" />
              <ChampARemplir intitule="Une phrase sur l'origine du produit — le mois de panne vécu et mesuré" />
              <ChampARemplir intitule="Un canal joignable — e-mail, GitHub, X" />
              <p className="text-xs">
                Le portrait est facultatif. Le nom et le canal joignable ne le sont pas : ce sont
                eux qui remplacent l&apos;entreprise absente.
              </p>
            </div>
          </div>
        </ARemplir>
      </div>
    </section>
  );
}
