import { Cadre } from "./EcranCadre";

/**
 * Le plan d'un workflow, rejoué en HTML.
 *
 * L'application le dessine en SVG à sa taille naturelle ; ici la page doit
 * tenir dans 360 px, donc les mêmes signaux sont portés par des blocs qui
 * s'empilent — même filet, même mono, mêmes étiquettes. On ne rapetisse pas un
 * plan pour le faire entrer : on le remonte.
 *
 * Trois choses se lisent d'un coup, et aucune ne repose sur la couleur seule :
 * le point de départ est nommé, la transition douteuse est écrite autant que
 * pointillée, et l'étape sans fichier le dit en toutes lettres.
 */
interface Etape {
  numero: number;
  role: string;
  fichier: string;
  /** `null` quand le fichier déclaré n'est pas sur le disque. */
  lignes: number | null;
  /** L'étape précédente annonce-t-elle celle-ci ? */
  confirmee: boolean;
  appelle?: string[];
}

const ETAPES: Etape[] = [
  { numero: 1, role: "Cadrer la fiche", fichier: "etapes/cadrage.md", lignes: 84, confirmee: true },
  { numero: 2, role: "Créer le dépôt", fichier: "etapes/depot.md", lignes: 61, confirmee: true },
  {
    numero: 3,
    role: "Écrire le produit",
    fichier: "etapes/produit.md",
    lignes: 132,
    confirmee: true,
    appelle: ["/grilling", "migrateur"],
  },
  { numero: 4, role: "Mettre en ligne", fichier: "etapes/mise-en-ligne.md", lignes: null, confirmee: false },
];

export function EcranPlan() {
  return (
    <Cadre chemin="~/.claude/skills/lancer/SKILL.md" etiquette="plan du workflow">
      <ol>
        {ETAPES.map((etape, rang) => (
          <li key={etape.numero}>
            {rang === 0 ? (
              <p className="mb-1 font-mono text-[11px] text-ink-soft">
                <span aria-hidden>▸ </span>point de départ, déclaré dans le SKILL.md
              </p>
            ) : (
              <Transition confirmee={etape.confirmee} />
            )}
            <Bloc etape={etape} />
          </li>
        ))}
      </ol>
    </Cadre>
  );
}

function Transition({ confirmee }: { confirmee: boolean }) {
  if (confirmee) return <div aria-hidden className="ml-4 h-5 border-l border-line" />;

  return (
    <div className="ml-4 flex items-center gap-2">
      <span aria-hidden className="h-5 border-l border-dashed border-line-strong" />
      <span className="font-mono text-[11px] text-muted">transition non confirmée par l&apos;étape</span>
    </div>
  );
}

function Bloc({ etape }: { etape: Etape }) {
  const manquant = etape.lignes === null;

  return (
    <div className={`rounded-lg border bg-paper px-3 py-2 ${manquant ? "border-danger" : "border-line"}`}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs tabular-nums text-muted">{etape.numero}</span>
        <span className="flex-1 text-sm font-medium">{etape.role}</span>
      </div>
      <p className="mt-0.5 pl-7 font-mono text-[11px] text-muted">
        {etape.fichier} ·{" "}
        {manquant ? <span className="text-danger">fichier absent</span> : `${etape.lignes} l.`}
      </p>
      {etape.appelle && (
        <ul className="mt-2 flex flex-wrap gap-1.5 pl-7">
          {etape.appelle.map((nom) => (
            <li key={nom} className="chip font-mono">
              {nom}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
