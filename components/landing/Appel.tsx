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
 * Le dépôt est **privé** (arbitré le 18 août 2026). Le chemin gratuit n'a donc
 * aucune adresse, et ce n'est pas qu'un manque d'affichage : l'installation
 * passe aujourd'hui par un clone du dépôt, donc **personne ne peut installer
 * l'outil**, ni gratuitement ni après avoir payé. Voir `MiseEnRoute`.
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
  /* Faute de destination, PAS de bouton. Un `<span>` stylé en bouton n'est ni
     focusable ni cliquable : il promet une action qui n'existe pas, et son
     excuse vivait dans un `title` — invisible au tactile, donc pour la majorité
     du trafic. Mieux vaut une phrase vraie qu'un bouton mort. */
  if (!DEPOT_PUBLIC) {
    return (
      <p className="text-sm text-muted">
        La lecture est gratuite et le restera. Le canal de distribution n&apos;est pas encore
        ouvert&nbsp;:{" "}
        <a href="mailto:vincent.avez22@gmail.com" className="text-ink underline underline-offset-4">
          écris-moi
        </a>{" "}
        pour y accéder.
      </p>
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
