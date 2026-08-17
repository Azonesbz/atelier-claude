/**
 * Le cadre commun aux cinq reconstructions de la page.
 *
 * Le produit tourne sur la machine de l'acheteur : il n'y a pas de démo à
 * visiter, et une capture d'écran de son propre dossier montrerait des noms de
 * projets personnels. Reste la reconstruction en HTML — c'est ce que font les
 * pages les mieux notées du panel, et c'est la seule preuve qu'on puisse
 * regarder sans rien installer.
 *
 * Le cadre est unique et partagé pour une raison : cinq écrans dessinés chacun
 * à sa manière donnent l'impression de cinq outils. Même bandeau, même filet,
 * même vocabulaire de chemin partout.
 *
 * Les nombres affichés sont ceux du banc de l'auteur. Ils illustrent
 * l'interface ; ils ne prétendent à rien d'autre.
 */
export function Cadre({
  chemin,
  etiquette,
  children,
}: {
  chemin: string;
  etiquette: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-baseline gap-3 border-b border-line px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-soft">{chemin}</span>
        <span className="surtitre shrink-0">{etiquette}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * L'en-tête d'une colonne ou d'un groupe : son nom, et combien.
 *
 * Le compte est en `tabular-nums` et l'interlettrage du surtitre y est annulé —
 * un nombre espacé de 0,18em ne se lit plus comme un nombre.
 */
export function Tete({ titre, compte, ton }: { titre: string; compte: number; ton: string }) {
  return (
    <p className="surtitre mb-2 flex items-baseline justify-between gap-2 border-b border-line pb-2">
      {titre}
      <span className={`font-mono text-xs tracking-normal tabular-nums ${ton}`}>{compte}</span>
    </p>
  );
}
