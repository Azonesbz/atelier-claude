"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * La navigation, présente partout.
 *
 * L'outil tenait sur une seule page de sept mille pixels : on savait où on
 * était parce qu'il n'y avait qu'un endroit. Avec des routes, il faut un
 * repère fixe — collé en haut, il survit au défilement d'une liste longue.
 */
const ENTREES = [
  { href: "/", libelle: "Vue d'ensemble" },
  { href: "/competences", libelle: "Compétences" },
  { href: "/workflows", libelle: "Workflows" },
  { href: "/agents", libelle: "Agents" },
  { href: "/reglages", libelle: "Réglages" },
  { href: "/veille", libelle: "Veille" },
] as const;

export function Dock() {
  const chemin = usePathname();

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-8 border-b border-line bg-paper/90 px-4 backdrop-blur sm:-mx-6 sm:px-6">
      <nav aria-label="Sections" className="flex items-center gap-1 overflow-x-auto py-2">
        <Link href="/" className="mr-4 shrink-0 font-display text-lg whitespace-nowrap">
          Atelier Claude
        </Link>
        {ENTREES.map((e) => {
          const actif = e.href === "/" ? chemin === "/" : chemin.startsWith(e.href);
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={actif ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                actif ? "bg-accent text-paper" : "text-muted hover:bg-accent-wash hover:text-ink"
              }`}
            >
              {e.libelle}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
