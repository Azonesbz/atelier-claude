"use client";

import { useActionState } from "react";
import { choisirProjet, type RetourProjet } from "@/app/actions-projet";
import type { ProjetConnu } from "@/lib/lecture/projets";

const VIERGE: RetourProjet = { etat: "vierge", message: "" };

/**
 * Le choix du projet regardé.
 *
 * La liste vient des projets où Claude Code a réellement travaillé, lus dans
 * le `cwd` de leurs transcriptions — jamais deviné depuis le nom de dossier,
 * qui est ambigu.
 */
export function ChoixProjet({
  connus,
  actuel,
  impose,
}: {
  connus: ProjetConnu[];
  actuel: string | null;
  impose: string | null;
}) {
  const [retour, action, enCours] = useActionState(choisirProjet, VIERGE);

  if (impose) {
    return (
      <p className="mt-3 text-xs text-attenue">
        Projet imposé par <code>ATELIER_PROJET={impose}</code> — relance sans cette variable pour
        pouvoir en choisir un autre.
      </p>
    );
  }

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <label className="text-xs text-attenue">
        <span className="sr-only">Projet à regarder</span>
        {/* `key` force le remontage après un changement : sur un <select> non
            contrôlé, React ne réapplique pas `defaultValue` au re-rendu, et le
            sélecteur restait sur « détecter » alors qu'un projet était choisi. */}
        <select
          key={actuel ?? "auto"}
          name="projet"
          defaultValue={actuel ?? ""}
          className="max-w-[28rem] rounded border border-bord bg-carte px-2 py-1.5 font-mono text-xs"
        >
          <option value="">— détecter depuis le dossier de lancement —</option>
          {connus.map((p) => (
            <option key={p.chemin} value={p.chemin}>
              {p.chemin}
            </option>
          ))}
          {actuel && !connus.some((p) => p.chemin === actuel) && (
            <option value={actuel}>{actuel}</option>
          )}
        </select>
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="rounded border border-bord px-3 py-1.5 text-xs disabled:opacity-40"
      >
        {enCours ? "Lecture…" : "Regarder ce projet"}
      </button>
      {retour.etat !== "vierge" && (
        <span
          role={retour.etat === "refuse" ? "alert" : "status"}
          className={`text-xs ${retour.etat === "fait" ? "text-calme" : "text-alerte"}`}
        >
          {retour.message}
        </span>
      )}
    </form>
  );
}
