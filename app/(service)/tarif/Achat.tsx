"use client";

import { Show, SignUpButton } from "@clerk/nextjs";
import { useState } from "react";

/**
 * Le bouton d'achat : il ne fait qu'ouvrir la page hébergée par Stripe.
 *
 * Il exige un compte, et le dit avant le clic plutôt qu'après. L'achat se
 * rattache au compte au moment du paiement : sans compte, il serait orphelin
 * et l'acheteur ne pourrait jamais le faire valoir.
 */
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
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <button type="button" className="btn-primary mt-4 w-full">
            Créer un compte et acheter
          </button>
        </SignUpButton>
        <p className="mt-2 text-xs text-muted">
          L&apos;achat se rattache à ton compte : c&apos;est lui qui ouvrira l&apos;écriture dans
          l&apos;application, sans rien à copier.
        </p>
      </Show>

      <Show when="signed-in">
        <button type="button" onClick={acheter} disabled={enCours} className="btn-primary mt-4 w-full">
          {enCours ? "Ouverture…" : "Acheter la licence"}
        </button>
      </Show>

      {erreur && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {erreur}
        </p>
      )}
    </>
  );
}
