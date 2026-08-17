"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * La navigation de l'application.
 *
 * Rail vertical à partir de `md`, barre horizontale en dessous. Ce n'est pas
 * un site : le chrome ne défile pas, seule la zone de contenu bouge. C'est
 * aussi ce qui survivra à un empaquetage en logiciel, là où une colonne
 * centrée à grandes marges ne survivrait pas.
 */
const ENTREES = [
  { href: "/", libelle: "Vue d'ensemble" },
  { href: "/competences", libelle: "Compétences" },
  { href: "/workflows", libelle: "Workflows" },
  { href: "/agents", libelle: "Agents" },
  { href: "/reglages", libelle: "Réglages" },
  { href: "/veille", libelle: "Veille" },
  { href: "/licence", libelle: "Compte" },
] as const;

function estActif(chemin: string, href: string): boolean {
  return href === "/" ? chemin === "/" : chemin.startsWith(href);
}

export function Rail() {
  const chemin = usePathname();

  return (
    <>
      {/* Rail : la navigation d'une application de bureau. */}
      <nav
        aria-label="Sections"
        className="hidden w-56 shrink-0 flex-col gap-1 border-r border-line bg-surface/40 px-3 py-4 md:flex"
      >
        <Link href="/" className="mb-4 px-2 font-display text-xl">
          Atelier Claude
        </Link>
        {ENTREES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={estActif(chemin, e.href) ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              estActif(chemin, e.href)
                ? "bg-accent-wash font-medium text-ink"
                : "text-muted hover:bg-accent-wash hover:text-ink"
            }`}
          >
            {e.libelle}
          </Link>
        ))}
      </nav>

      {/* En fenêtre étroite, le rail se couche. */}
      <nav
        aria-label="Sections"
        className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-surface/40 px-3 py-2 md:hidden"
      >
        <Link href="/" className="mr-2 shrink-0 font-display text-base">
          Atelier
        </Link>
        {ENTREES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={estActif(chemin, e.href) ? "page" : undefined}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors ${
              estActif(chemin, e.href) ? "bg-accent text-paper" : "text-muted"
            }`}
          >
            {e.libelle}
          </Link>
        ))}
      </nav>
    </>
  );
}
