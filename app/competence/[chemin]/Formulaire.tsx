"use client";

import { useActionState } from "react";
import { enregistrer, type Retour } from "./actions";

const DEPART: Retour = { etat: "vierge", message: "" };

export function Formulaire({
  chemin,
  description,
  indiceArgument,
  corps,
  modifiable,
  raisonDuRefus,
}: {
  chemin: string;
  description: string;
  indiceArgument: string;
  corps: string;
  modifiable: boolean;
  raisonDuRefus: string;
}) {
  const [retour, action, enCours] = useActionState(enregistrer, DEPART);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="chemin" value={chemin} />

      {!modifiable && (
        <p className="rounded border border-alerte/30 bg-alerte-fond px-3 py-2 text-sm text-alerte">
          {raisonDuRefus}
        </p>
      )}

      <Champ etiquette="Description" aide="Ce que le modèle lit pour décider de charger la compétence.">
        <textarea
          name="description"
          defaultValue={description}
          rows={3}
          disabled={!modifiable}
          className="w-full rounded border border-bord bg-carte p-2 text-sm disabled:opacity-60"
        />
      </Champ>

      <Champ etiquette="Indice d'argument" aide="Affiché après le nom de la commande. Laisser vide pour retirer la ligne.">
        <input
          name="argument-hint"
          defaultValue={indiceArgument}
          disabled={!modifiable}
          className="w-full rounded border border-bord bg-carte p-2 font-mono text-sm disabled:opacity-60"
        />
      </Champ>

      <Champ etiquette="Corps" aide="Les instructions elles-mêmes. Le frontmatter n'est pas touché.">
        <textarea
          name="corps"
          defaultValue={corps}
          rows={22}
          disabled={!modifiable}
          className="w-full rounded border border-bord bg-carte p-3 font-mono text-xs leading-relaxed disabled:opacity-60"
        />
      </Champ>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!modifiable || enCours}
          className="rounded bg-encre px-4 py-2 text-sm font-medium text-fond disabled:opacity-40"
        >
          {enCours ? "Écriture…" : "Enregistrer"}
        </button>
        {retour.etat !== "vierge" && (
          <span className={`text-sm ${retour.etat === "enregistre" ? "text-calme" : "text-alerte"}`}>
            {retour.message}
          </span>
        )}
      </div>
    </form>
  );
}

function Champ({
  etiquette,
  aide,
  children,
}: {
  etiquette: string;
  aide: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{etiquette}</span>
      <span className="mb-1 block text-xs text-attenue">{aide}</span>
      {children}
    </label>
  );
}
