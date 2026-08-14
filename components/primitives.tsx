import type { Portee, Silence } from "@/lib/types";

const COULEUR_PORTEE: Record<Portee, string> = {
  utilisateur: "bg-bord text-encre",
  projet: "bg-calme/15 text-calme",
  plugin: "bg-attenue/15 text-attenue",
  intégré: "bg-attenue/10 text-attenue",
};

export function Pastille({ portee, origine }: { portee: Portee; origine: string }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] ${COULEUR_PORTEE[portee]}`}
      title={`portée ${portee}`}
    >
      {origine}
    </span>
  );
}

export function Panneau({
  titre,
  compte,
  ecarts,
  children,
}: {
  titre: string;
  compte: number;
  ecarts?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 flex items-baseline gap-3 border-b border-bord pb-2 text-sm font-semibold tracking-wide uppercase">
        {titre}
        <span className="font-mono text-xs font-normal text-attenue">{compte}</span>
        {ecarts ? (
          <span className="font-mono text-xs font-normal text-alerte">{ecarts} à regarder</span>
        ) : null}
      </h2>
      {compte === 0 ? (
        <p className="text-sm text-attenue">Rien ici — et c&apos;est une information.</p>
      ) : (
        children
      )}
    </section>
  );
}

export function Silences({ silences }: { silences: Silence[] }) {
  if (silences.length === 0) return null;
  return (
    <ul className="mt-1 space-y-1">
      {silences.map((s, i) => (
        <li
          key={i}
          className="rounded border border-alerte/30 bg-alerte-fond px-2 py-1 text-xs text-alerte"
        >
          <strong className="font-semibold">{s.cause}</strong> — {s.detail}
        </li>
      ))}
    </ul>
  );
}

export function Ligne({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-b border-bord py-2 last:border-0">
      <div className="flex flex-wrap items-baseline gap-2">{children}</div>
    </li>
  );
}

export function Liste({ children }: { children: React.ReactNode }) {
  return <ul className="rounded-lg border border-bord bg-carte px-4">{children}</ul>;
}
