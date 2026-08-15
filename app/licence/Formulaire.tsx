"use client";

import { useActionState } from "react";
import { enregistrer, type RetourLicence } from "./actions";

const VIERGE: RetourLicence = { etat: "vierge", message: "" };

export function FormulaireLicence({ cle }: { cle: string }) {
  const [retour, action, enCours] = useActionState(enregistrer, VIERGE);

  return (
    <form action={action} className="mt-4 space-y-2">
      <label className="label" htmlFor="cle">
        Clé de licence
      </label>
      <input id="cle" name="cle" defaultValue={cle} placeholder="AC-…" className="field font-mono" />
      <div className="flex gap-2">
        <button type="submit" disabled={enCours} className="btn-primary">
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="submit"
          disabled={enCours}
          onClick={(e) => {
            const champ = e.currentTarget.form?.elements.namedItem("cle") as HTMLInputElement;
            champ.value = "";
          }}
          className="btn-ghost"
        >
          Retirer
        </button>
      </div>
      {retour.etat !== "vierge" && (
        <p
          role={retour.etat === "refuse" ? "alert" : "status"}
          className={`text-xs ${retour.etat === "fait" ? "text-ink-soft" : "text-danger"}`}
        >
          {retour.message}
        </p>
      )}
    </form>
  );
}
