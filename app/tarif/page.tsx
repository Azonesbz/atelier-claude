import { Achat } from "./Achat";

export const dynamic = "force-dynamic";

/**
 * L'offre, côté service.
 *
 * Le partage est celui du produit : lire son dossier .claude est gratuit — le
 * diagnostic est ce qu'on donne. Le modifier depuis l'interface est ce qui se
 * paie.
 */
export default function Tarif() {
  return (
    <main className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl">Atelier Claude</h1>
      <p className="mt-3 text-sm text-muted">
        Voir ce qui est présent mais sans effet dans ton dossier <code>.claude</code> — un plugin
        déclaré dont le code a disparu, un agent sans description, une étape de workflow qui ne
        s&apos;exécutera jamais.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <section className="card p-5">
          <h2 className="surtitre">Lire</h2>
          <p className="mt-2 font-display text-2xl">Gratuit</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>L&apos;inventaire complet, avec la provenance</li>
            <li>Les écarts, avec leur règle de détection</li>
            <li>Le plan des workflows</li>
            <li>Le hook de veille</li>
          </ul>
        </section>

        <section className="card border-accent/40 p-5">
          <h2 className="surtitre">Modifier</h2>
          <p className="mt-2 font-display text-2xl">Achat unique</p>
          <p className="mt-1 text-xs text-muted">Une fois. Mises à jour comprises, à vie.</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>Éditer une compétence depuis l&apos;interface</li>
            <li>Ajouter, retirer, renuméroter des étapes</li>
            <li>Créer et brancher des sous-agents</li>
          </ul>
          <Achat />
        </section>
      </div>

      <p className="mt-6 text-xs text-muted">
        L&apos;application tourne sur ta machine et lit ton disque : rien de ton dossier
        <code> .claude</code> n&apos;est envoyé ici. Le service ne sait qu&apos;une chose — si ton achat existe.
      </p>
    </main>
  );
}
