import type { Portee, Silence } from "@/lib/types";

const COULEUR_PORTEE: Record<Portee, string> = {
  utilisateur: "border-line-strong text-ink-soft",
  projet: "border-accent/40 text-ink",
  plugin: "text-muted",
  intégré: "text-muted",
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
      className={`chip max-w-[14rem] shrink-0 truncate font-mono ${COULEUR_PORTEE[portee]}`}
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
      <h2 className="surtitre mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-2">
        {titre}
        <span className="font-mono text-xs font-normal text-muted">{compte}</span>
        {ecarts ? (
          <span className="font-mono text-xs font-normal text-danger">
            dont {ecarts} sans effet
          </span>
        ) : null}
      </h2>
      {intro && <p className="mb-3 max-w-prose text-xs text-muted">{intro}</p>}
      {compte === 0 ? <p className="text-sm text-muted">{vide ?? "Rien ici."}</p> : children}
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
          className="rounded border border-danger/40 bg-danger-wash px-2 py-1 text-xs text-danger"
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
    <li className="border-b border-line py-2 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">{titre}</div>
      {description && (
        <p className="mt-0.5 line-clamp-2 max-w-prose text-xs text-muted" title={description}>
          {description}
        </p>
      )}
      {silences && <Silences silences={silences} />}
    </li>
  );
}

export function Liste({ children }: { children: React.ReactNode }) {
  return <ul className="card px-4">{children}</ul>;
}
