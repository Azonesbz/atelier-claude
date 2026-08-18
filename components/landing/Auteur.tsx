/**
 * L'auteur — la seule preuve sociale disponible, et c'est assumé.
 *
 * Le produit n'a aucun acheteur : témoignages, logos et compteurs sont donc
 * interdits, et rien ne les remplace par un ersatz. Ce qui reste tenable, c'est
 * une personne responsable en face d'un outil qui écrit dans `~/.claude` — le
 * panel montre que l'anonymat s'y paie plus cher qu'ailleurs.
 *
 * L'origine n'est pas une histoire de marque : elle est datée et mesurée, et
 * les deux chiffres cités sont ceux d'une seule machine. C'est dit.
 */

export function Auteur() {
  return (
    <section className="mt-20">
      <h2 className="surtitre">// L&apos;AUTEUR</h2>

      <div className="card mt-5 max-w-prose p-6">
        <p className="text-lg font-medium text-ink">Vincent Avez</p>

        <p className="mt-3 text-sm text-ink-soft">
          J&apos;ai écrit Orcha parce que j&apos;ai perdu un mois sans le savoir. Un plugin
          inscrit dans mes réglages depuis le 14 juillet, dont la charge utile avait disparu du
          disque&nbsp;: aucun avertissement, code de retour 0. Je ne l&apos;ai vu qu&apos;en
          comptant mes propres transcriptions, un mois plus tard.
        </p>

        <p className="mt-3 text-sm text-muted">
          Rien de rare, et il faut le dire&nbsp;: n&apos;importe qui utilisant Claude Code
          sérieusement a le même matériau. J&apos;avais seulement la panne, datée, et
          l&apos;envie de ne plus la revivre en silence.
        </p>

        <p className="mt-4 text-sm">
          <a
            href="mailto:vincent.avez22@gmail.com"
            className="text-ink underline underline-offset-4"
          >
            vincent.avez22@gmail.com
          </a>
          <span className="text-muted"> — une vraie adresse, qui répond.</span>
        </p>
      </div>
    </section>
  );
}
