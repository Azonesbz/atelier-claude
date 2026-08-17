import Link from "next/link";

/**
 * L'appel à l'action, en un seul endroit — donc en un seul libellé.
 *
 * Le panel concurrent est net sur ce point : les pages qui rament ont quatre à
 * neuf libellés qui se disputent le même écran, et le lecteur ne sait plus ce
 * qu'on attend de lui. Ici le libellé est calculé une fois et réutilisé aux
 * quatre points de décision. Le changer, c'est le changer partout.
 *
 * Le montant fait partie du libellé quand Stripe le donne : chez les quatre
 * vendeurs sans notoriété du panel, il y est sans exception. Sans tarif
 * configuré, le bouton le perd — voir `lib/licence/tarif.ts`.
 */

/**
 * EMPLACEMENT — la destination du chemin gratuit.
 *
 * Le distant s'appelle encore `atelier-claude` alors que le produit s'appelle
 * Orcha, et rien ne dit qu'il soit public. Tant que ce n'est pas tranché, le
 * chemin gratuit n'a pas d'adresse sûre : on ne rend pas un lien mort.
 */
export const DEPOT_PUBLIC: string | null = null;

export function libelleAchat(montant: string | null): string {
  return montant ? `Acheter la licence — ${montant}` : "Acheter la licence";
}

export function AppelPrincipal({
  montant,
  pleineLargeur = false,
}: {
  montant: string | null;
  pleineLargeur?: boolean;
}) {
  return (
    <Link href="/tarif" className={`btn-primary ${pleineLargeur ? "w-full" : ""}`}>
      {libelleAchat(montant)}
    </Link>
  );
}

/**
 * Le chemin gratuit, volontairement subordonné.
 *
 * Il n'est pas là par générosité : le lien d'échappement rend l'achat
 * volontaire, donc crédible. Et il est plus fort ici que chez les concurrents
 * — leur gratuit montre une maquette, le nôtre montre au lecteur son propre
 * dossier `.claude`.
 */
export function AppelSecondaire({ libelle = "Tout voir gratuitement, sur ta machine" }) {
  if (!DEPOT_PUBLIC) {
    return (
      <span className="btn-ghost cursor-not-allowed" title="Destination à définir avant publication">
        {libelle}
      </span>
    );
  }

  return (
    <a href={DEPOT_PUBLIC} className="btn-ghost" rel="noreferrer noopener">
      {libelle} →
    </a>
  );
}

/**
 * Les trois réducteurs de risque, au contact du bouton.
 *
 * Position volontaire : le panel montre que le local-first ne vend rien quand
 * il traîne dans une grille de fonctionnalités — il désarme le doute au moment
 * de payer, et seulement là.
 */
export function Reducteurs() {
  const points = ["Achat unique, à vie", "Rien ne quitte ta machine", "La lecture est gratuite"];

  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {points.map((point) => (
        <li key={point} className="flex items-center gap-1.5">
          <span aria-hidden className="size-1 rounded-full bg-muted" />
          {point}
        </li>
      ))}
    </ul>
  );
}
