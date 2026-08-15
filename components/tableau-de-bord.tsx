import Link from "next/link";

/**
 * Les pièces du tableau de bord.
 *
 * Aucun graphique pour les compteurs : douze compétences et quarante règles de
 * permission ne se comparent pas, ce sont des objets différents. Une tuile dit
 * un nombre et ce qu'il vaut ; c'est tout ce qu'on peut en dire honnêtement.
 */
export function Tuile({
  titre,
  valeur,
  precision,
  href,
  alerte,
}: {
  titre: string;
  valeur: string | number;
  precision?: string;
  href?: string;
  alerte?: boolean;
}) {
  const contenu = (
    <>
      <span className="surtitre block">{titre}</span>
      {/* Pacifico est réservée au nom du produit : sur un mot, une valeur de
          tuile devient décorative et se lit mal. Les nombres la gardent, ils
          restent des chiffres. */}
      <span
        className={`mt-2 block leading-none ${
          typeof valeur === "number" ? "font-display text-3xl tabular-nums" : "text-xl font-semibold"
        } ${alerte ? "text-danger" : "text-ink"}`}
      >
        {valeur}
      </span>
      {precision && <span className="mt-1.5 block text-xs text-muted">{precision}</span>}
    </>
  );

  const classe = `card px-4 py-3.5 ${href ? "transition-colors hover:border-accent/40" : ""}`;
  return href ? (
    <Link href={href} className={classe}>
      {contenu}
    </Link>
  ) : (
    <div className={classe}>{contenu}</div>
  );
}

/** Une part de la répartition : nom, compte, et le pas de gris qui l'encode. */
export interface Part {
  nom: string;
  compte: number;
  detail: string;
}

/**
 * D'où vient ce qui charge, en une barre.
 *
 * Trois nuances de gris et non trois teintes : la charte n'a pas de couleur de
 * marque. Le validateur de palette a refusé le premier jeu — ΔE 11,4 entre deux
 * pas voisins, sous le seuil de 15 même en vision normale. Élargi, il passe à
 * 27. Le pas le plus sombre reste sous 3:1 contre la surface, ce qui n'est
 * permis qu'avec des étiquettes visibles : chaque segment porte donc son nom et
 * son compte, et la couleur n'est jamais seule à porter l'information.
 */
const PAS = ["#fafafa", "#9b9ba3", "#4d4d55"];

export function RepartitionPortee({ parts }: { parts: Part[] }) {
  const total = parts.reduce((somme, p) => somme + p.compte, 0);
  if (total === 0) return null;

  return (
    <section className="card px-4 py-3.5">
      <h2 className="surtitre">D&apos;où vient ce qui charge</h2>

      <div className="mt-3 flex gap-0.5" role="img" aria-label={legende(parts)}>
        {parts
          .filter((p) => p.compte > 0)
          .map((p, i) => (
            <span
              key={p.nom}
              className="h-2.5 rounded-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(p.compte / total) * 100}%`, background: PAS[i % PAS.length] }}
            />
          ))}
      </div>

      <dl className="mt-3 space-y-1.5">
        {parts.map((p, i) => (
          <div key={p.nom} className="flex items-baseline gap-2 text-xs">
            <span
              aria-hidden
              className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: PAS[i % PAS.length] }}
            />
            <dt className="text-ink-soft">{p.nom}</dt>
            <dd className="font-mono tabular-nums text-muted">{p.compte}</dd>
            <dd className="min-w-0 flex-1 truncate text-muted">{p.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function legende(parts: Part[]): string {
  return parts.map((p) => `${p.nom} : ${p.compte}`).join(", ");
}

/** Ce qui demande une décision. Vide, c'est la bonne nouvelle. */
export function Ecarts({
  lignes,
}: {
  lignes: Array<{ quoi: string; cause: string; ou: string; href?: string }>;
}) {
  return (
    <section className="card px-4 py-3.5">
      <h2 className="surtitre">Ce qui demande un coup d&apos;œil</h2>
      {lignes.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          Rien. Tout ce qui est déclaré charge réellement.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lignes.map((l, i) => (
            <li key={i} className="border-b border-line pb-2 text-sm last:border-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                {l.href ? (
                  <Link href={l.href} className="font-medium underline decoration-line underline-offset-4">
                    {l.quoi}
                  </Link>
                ) : (
                  <span className="font-medium">{l.quoi}</span>
                )}
                <span className="text-xs text-danger">{l.cause}</span>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-muted">{l.ou}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
