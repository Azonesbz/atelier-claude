"use client";

import { useTransition } from "react";
import { deconnecter } from "./actions";

/** Oublier la session locale. Le compte, lui, n'est pas touché. */
export function Deconnexion() {
  const [enCours, demarrer] = useTransition();

  return (
    <button
      type="button"
      disabled={enCours}
      onClick={() => demarrer(() => deconnecter())}
      className="btn-secondary"
    >
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
