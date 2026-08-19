import Link from "next/link";

/**
 * Le pied de page légal.
 *
 * Les trois textes existent désormais. Ce qui reste vide à l'intérieur — statut
 * de l'éditeur, SIREN, médiateur — y est signalé page par page plutôt
 * qu'ici : un lecteur qui cherche les mentions légales les ouvre, il ne lit pas
 * un avertissement en pied de page.
 */
export function PiedService() {
  return (
    <footer className="mt-24 border-t border-line pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
        <p className="max-w-md">
          Orcha — l&apos;outil tourne sur ta machine et lit ton disque. Le service ne sait
          qu&apos;une chose&nbsp;: si ton achat existe.
        </p>

        <nav className="flex flex-wrap gap-4">
          <Link href="/mentions" className="underline underline-offset-4 hover:text-ink">
            Mentions légales
          </Link>
          <Link href="/cgv" className="underline underline-offset-4 hover:text-ink">
            Conditions de vente
          </Link>
          <Link href="/confidentialite" className="underline underline-offset-4 hover:text-ink">
            Confidentialité
          </Link>
        </nav>
      </div>
    </footer>
  );
}
