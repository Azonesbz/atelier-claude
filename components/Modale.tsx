"use client";

import { useEffect, useRef } from "react";

/**
 * Une modale sur `<dialog>` natif.
 *
 * `showModal()` apporte gratuitement ce qu'une div réimplémenterait mal : le
 * piège de focus, la fermeture à l'échappement, l'inertie du reste de la page
 * pour les lecteurs d'écran, et un fond stylable par `::backdrop`.
 */
export function Modale({
  ouverte,
  titre,
  aide,
  onFermer,
  children,
}: {
  ouverte: boolean;
  titre: string;
  aide: string;
  onFermer: () => void;
  children: React.ReactNode;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const noeud = dialogue.current;
    if (!noeud) return;
    if (ouverte && !noeud.open) noeud.showModal();
    if (!ouverte && noeud.open) noeud.close();
  }, [ouverte]);

  return (
    <dialog
      ref={dialogue}
      aria-label={titre}
      onClose={onFermer}
      /* Le clic sur le fond ferme : la cible de l'événement est alors le
         <dialog> lui-même, jamais un de ses enfants. */
      onClick={(e) => {
        if (e.target === dialogue.current) onFermer();
      }}
      /* `inset-0` + `m-auto` + `h-fit` : la préflight de Tailwind supprime la
         marge automatique que l'agent utilisateur pose sur un dialogue modal,
         et il retombait en bas de l'écran. */
      className="card fixed inset-0 m-auto h-fit max-h-[calc(100vh-4rem)] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto p-0 text-ink"
    >
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold">{titre}</h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="btn-ghost min-h-0 px-2 py-1 text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">{aide}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}

/** Les icônes, en trait, à la taille du texte. Aucune dépendance. */
export function Icone({ nom }: { nom: "plus" | "prise" | "agent" | "moins" | "numeros" }) {
  const traces: Record<string, string> = {
    plus: "M12 5v14M5 12h14",
    prise: "M9 7V4m6 3V4M7 7h10v5a5 5 0 0 1-10 0V7Zm5 10v3",
    agent: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 11-5.7M17 15v6m3-3h-6",
    moins: "M5 12h14",
    numeros: "M4 6h1v4M4 10h2M6 18H4l2-3H4M11 6h9M11 12h9M11 18h9",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d={traces[nom]} />
    </svg>
  );
}
