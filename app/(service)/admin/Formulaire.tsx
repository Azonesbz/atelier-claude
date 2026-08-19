"use client";

import { useActionState } from "react";
import { offrirAcces, type RetourFaveur } from "./actions";

const VIERGE: RetourFaveur = { etat: "vierge", message: "" };

/** Offrir ou retirer l'accès, par adresse. */
export function FormulaireFaveur() {
  const [retour, action, enCours] = useActionState(offrirAcces, VIERGE);

  return (
    <form action={action} className="mt-4 space-y-2">
      <label className="label" htmlFor="courriel">
        Adresse du compte
      </label>
      <input id="courriel" name="courriel" placeholder="ami@exemple.fr" className="field font-mono" />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enCours} className="btn-primary">
          {enCours ? "…" : "Offrir l'accès"}
        </button>
        <button
          type="submit"
          name="retirer"
          value="1"
          disabled={enCours}
          className="btn-secondary"
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
