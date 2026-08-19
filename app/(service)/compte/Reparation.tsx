"use client";

import { useActionState } from "react";
import { reclamerAcces, type RetourAcces } from "./actions";

const VIERGE: RetourAcces = { etat: "vierge", message: "" };

/**
 * Le rattrapage : l'acheteur a payé mais s'est trompé d'identifiant GitHub.
 *
 * C'est le cas le plus probable de tout le parcours — une faute de frappe dans
 * un champ libre — et il ne doit surtout pas obliger à écrire un courriel. Le
 * webhook s'occupe du cas nominal ; ceci répare le reste.
 */
export function Reparation({ dejaInvite }: { dejaInvite: string | null }) {
  const [retour, action, enCours] = useActionState(reclamerAcces, VIERGE);

  return (
    <form action={action} className="mt-4 space-y-2">
      <label className="label" htmlFor="github">
        {dejaInvite ? "Renvoyer l'accès à un autre identifiant" : "Ton identifiant GitHub"}
      </label>
      <input
        id="github"
        name="github"
        defaultValue={dejaInvite ?? ""}
        placeholder="Azonesbz"
        className="field font-mono"
      />
      <button type="submit" disabled={enCours} className="btn-primary">
        {enCours ? "Envoi…" : "Recevoir l'accès au dépôt"}
      </button>
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
