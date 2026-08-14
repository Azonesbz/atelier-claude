import type { Portee, Silence } from "@/lib/types";

const COULEUR_PORTEE: Record<Portee, string> = {
  utilisateur: "bg-bord text-encre",
  projet: "bg-calme/15 text-calme",
  plugin: "bg-attenue/20 text-attenue",
  intégré: "bg-attenue/20 text-attenue",
};

/**
 * Ce que chaque portée veut dire, en une phrase.
 *
 * Le mot « portée » ne définit rien pour qui découvre l'outil, et la couleur
 * seule ne portait pas l'information — `plugin` et `intégré` différaient de
 * 5 % d'opacité, soit 1,07:1.
 */
const SENS_PORTEE: Record<Portee, string> = {
  utilisateur: "Vient de ton dossier personnel. Actif dans toutes tes sessions, et modifiable ici.",
  projet: "Vient du .claude de ce projet. Actif seulement ici, et modifiable ici.",
  plugin:
    "Fourni par un plugin installé. Actif partout, mais non modifiable ici : un plugin est un clone qui sera réécrit à sa mise à jour.",
  intégré: "Fourni par Claude Code lui-même. Aucun fichier sur le disque.",
};

export function Pastille({ portee, origine }: { portee: Portee; origine: string }) {
  return (
    <span
      className={`inline-flex max-w-[12rem] shrink-0 truncate rounded px-1.5 py-0.5 font-mono text-[11px] ${COULEUR_PORTEE[portee]}`}
      title={SENS_PORTEE[portee]}
    >
      {portee} · {origine}
    </span>
  );
}

export function Panneau({
  titre,
  compte,
  ecarts,
  intro,
  vide,
  children,
}: {
  titre: string;
  compte: number;
  ecarts?: number;
  intro?: string;
  /** Ce qu'on a regardé, pour que « rien » ne veuille pas dire « cassé ». */
  vide?: string;
  children: React.ReactNode;
}) {
  const ancre = titre.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
  return (
    <section id={ancre} className="mb-10 scroll-mt-4">
      <h2 className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-bord pb-2 text-sm font-semibold tracking-wide uppercase">
        {titre}
        <span className="font-mono text-xs font-normal text-attenue">{compte}</span>
        {ecarts ? (
          <span className="font-mono text-xs font-normal text-alerte">
            dont {ecarts} sans effet
          </span>
        ) : null}
      </h2>
      {intro && <p className="mb-3 max-w-prose text-xs text-attenue">{intro}</p>}
      {compte === 0 ? <p className="text-sm text-attenue">{vide ?? "Rien ici."}</p> : children}
    </section>
  );
}

export function Silences({ silences }: { silences: Silence[] }) {
  if (silences.length === 0) return null;
  return (
    <ul className="mt-1 w-full space-y-1">
      {silences.map((s, i) => (
        <li
          key={i}
          className="rounded border border-alerte/40 bg-alerte-fond px-2 py-1 text-xs text-alerte"
        >
          <strong className="font-semibold">{s.cause}</strong> — {s.detail}
        </li>
      ))}
    </ul>
  );
}

/** Une entrée : la ligne de titre, puis la description sur sa propre rangée. */
export function Entree({
  titre,
  description,
  silences,
}: {
  titre: React.ReactNode;
  description?: string;
  silences?: Silence[];
}) {
  return (
    <li className="border-b border-bord py-2 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">{titre}</div>
      {description && (
        <p className="mt-0.5 line-clamp-2 max-w-prose text-xs text-attenue" title={description}>
          {description}
        </p>
      )}
      {silences && <Silences silences={silences} />}
    </li>
  );
}

export function Liste({ children }: { children: React.ReactNode }) {
  return <ul className="rounded-lg border border-bord bg-carte px-4">{children}</ul>;
}
