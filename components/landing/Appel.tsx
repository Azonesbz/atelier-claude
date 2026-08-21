/**
 * L'appel à l'action, en un seul endroit — donc en un seul libellé.
 *
 * Le panel concurrent est net sur ce point : les pages qui rament ont quatre à
 * neuf libellés qui se disputent le même écran, et le lecteur ne sait plus ce
 * qu'on attend de lui.
 *
 * Il n'y a plus de prix à afficher : le produit est libre, sous licence MIT.
 * Ce qu'on demande au lecteur n'est plus d'acheter mais d'installer, et la
 * commande EST l'appel à l'action — la montrer vaut mieux que la promettre.
 */

export const DEPOT_PUBLIC = "https://github.com/Azonesbz/atelier-claude";

/** La commande d'installation, affichée telle qu'on la tape. */
export function AppelPrincipal({ pleineLargeur = false }: { pleineLargeur?: boolean }) {
  return (
    <div className={pleineLargeur ? "w-full" : "inline-block"}>
      <pre className="overflow-x-auto rounded-lg border border-accent/40 bg-surface px-4 py-3 font-mono text-sm text-ink select-all">
        npx orcha-cli
      </pre>
    </div>
  );
}

/** Le chemin secondaire : lire le code avant de le lancer. */
export function AppelSecondaire({ libelle = "Lire le code sur GitHub" }) {
  return (
    <a href={DEPOT_PUBLIC} className="btn-ghost" rel="noreferrer noopener">
      {libelle} →
    </a>
  );
}

/**
 * Les trois réducteurs de risque, au contact de la commande.
 *
 * Position volontaire : le panel montre que le local-first ne vend rien quand
 * il traîne dans une grille de fonctionnalités — il désarme le doute au moment
 * de décider, et seulement là.
 */
export function Reducteurs() {
  const points = ["Libre et gratuit, licence MIT", "Rien ne quitte ta machine", "Node 20 suffit"];

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
