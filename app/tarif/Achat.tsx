"use client";

import { useState } from "react";

/** Le bouton d'achat : il ne fait qu'ouvrir la page hébergée par Stripe. */
export function Achat() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  async function acheter() {
    setEnCours(true);
    setErreur("");
    try {
      const reponse = await fetch("/api/paiement", { method: "POST" });
      const corps = (await reponse.json()) as { url?: string; erreur?: string };
      if (corps.url) window.location.href = corps.url;
      else setErreur(corps.erreur ?? "Paiement indisponible.");
    } catch {
      setErreur("Paiement indisponible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <button type="button" onClick={acheter} disabled={enCours} className="btn-primary mt-4 w-full">
        {enCours ? "Ouverture…" : "S'abonner"}
      </button>
      {erreur && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {erreur}
        </p>
      )}
    </>
  );
}
