import Link from "next/link";
import { ARemplir, ChampARemplir } from "./ARemplir";

/**
 * Le pied de page légal.
 *
 * Une page qui vend à des consommateurs en France doit porter des mentions
 * légales, des conditions de vente, une politique de confidentialité — un tiers
 * pose ici des cookies — et l'information sur le droit de rétractation. Rien de
 * tout cela ne s'invente : ces textes engagent, et une version plausible
 * rédigée d'office serait pire que leur absence, parce qu'elle passerait
 * inaperçue.
 *
 * D'où des emplacements signalés plutôt que remplis. La page ne peut pas être
 * publiée tant qu'ils le sont, et c'est exactement ce qu'ils doivent dire.
 */
export function PiedService() {
  return (
    <footer className="mt-24 border-t border-line pt-8">
      <ARemplir quoi="obligations légales — bloque la mise en ligne">
        <p>
          Une page de vente à des particuliers en France ne peut pas être publiée sans ces
          quatre textes. Ils engagent&nbsp;: ils doivent être écrits, pas devinés.
        </p>
        <div className="mt-3 space-y-2">
          <ChampARemplir intitule="Mentions légales — éditeur, statut, SIREN, hébergeur" />
          <ChampARemplir intitule="Conditions générales de vente — objet, prix, licence, support" />
          <ChampARemplir intitule="Politique de confidentialité — Clerk et Stripe traitent des données" />
          <ChampARemplir intitule="Droit de rétractation — et sa renonciation pour un contenu numérique fourni immédiatement" />
        </div>
      </ARemplir>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <p>
          Orcha — l&apos;outil tourne sur ta machine. Le service ne sait qu&apos;une chose&nbsp;:
          si ton achat existe.
        </p>
        <Link href="/produit" className="underline underline-offset-4">
          Retour à la présentation
        </Link>
      </div>
    </footer>
  );
}
