import { AppelPrincipal, AppelSecondaire } from "./Appel";

/**
 * La frontière gratuit / payé, argumentée — puis la carte qui mène au tunnel.
 *
 * Elle ne rejoue pas `/tarif` : elle donne la raison que le tunnel n'a pas la
 * place de donner, et s'arrête là. Le payant est cadré en commodité, jamais en
 * amputation, parce que le prétendre indispensable serait faux — cette cible
 * ouvre un éditeur et le vérifie en trente secondes.
 *
 * Le montant descend en prop et vaut `null` tant que le tarif Stripe n'existe
 * pas. La carte doit donc rester juste sans lui : « Achat unique » est la
 * promesse, le chiffre n'en est que la mesure.
 */

const ATELIER = [
  "Modifier une compétence depuis l'interface",
  "Ajouter, retirer, renuméroter des étapes",
  "Créer et brancher un sous-agent",
  "Mises à jour comprises, à vie",
  "Rien ne quitte ta machine — aucune télémétrie",
];

// Le liseré du payant est celui de `/tarif` : la page qui vend et le tunnel
// qu'elle ouvre doivent se reconnaître d'un coup d'œil.
function Carte({ montant }: { montant: string | null }) {
  return (
    <div className="card border-accent/40 p-6">
      <p className="surtitre">L&apos;atelier</p>
      <p className="mt-2 font-display text-3xl">{montant ?? "Achat unique"}</p>
      <p className="mt-1 text-sm text-muted">
        {montant ? "Achat unique. Une fois, pas par mois." : "Une fois, pas par mois."} Mises à jour
        comprises, à vie.
      </p>

      <ul className="mt-5 space-y-2 text-ink-soft">
        {ATELIER.map((ligne) => (
          <li key={ligne} className="flex items-baseline gap-2.5">
            <span aria-hidden className="size-1 shrink-0 rounded-full bg-muted" />
            {ligne}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <AppelPrincipal montant={montant} pleineLargeur />
      </div>
      <div className="mt-2 flex">
        <AppelSecondaire libelle="Ou installe-le et lis tout, gratuitement" />
      </div>
    </div>
  );
}

export function OffreTarif({ montant }: { montant: string | null }) {
  return (
    <section className="mt-20">
      <p className="surtitre">// OFFRE</p>
      <h2 className="mt-3 text-2xl sm:text-3xl">Lire est gratuit. Écrire s&apos;achète.</h2>

      <div className="mt-6 grid items-start gap-6 sm:grid-cols-2">
        <div>
          <p className="max-w-prose text-ink-soft">
            Le diagnostic est ce qu&apos;on donne : l&apos;inventaire, les écarts, le plan des
            workflows, la veille. L&apos;atelier est ce qui se paie — modifier une compétence,
            ajouter ou retirer une étape, créer et brancher un sous-agent.
          </p>

          <div className="mt-5 border-l border-line-strong pl-4">
            <p className="surtitre">Pourquoi l&apos;écriture se paie, et pas la lecture</p>
            <p className="mt-2 max-w-prose text-ink-soft">
              Écrire dans <code className="font-mono">~/.claude</code>, c&apos;est déposer des
              instructions que Claude Code exécutera. C&apos;est le geste gardé.
            </p>
          </div>
        </div>

        <Carte montant={montant} />
      </div>
    </section>
  );
}
