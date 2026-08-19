/**
 * Ce qu'on retient d'un événement Stripe.
 *
 * Le corps est signé, donc authentique — mais sa forme reste arbitraire, et
 * Stripe envoie beaucoup d'événements dont un seul nous concerne.
 *
 * La règle qui compte : **seul un paiement acquitté ouvre un accès**. Une
 * session ouverte puis abandonnée arrive aussi, et la confondre avec un achat
 * donnerait le dépôt à qui n'a rien payé.
 */

import { lireIdentifiantGithub } from "./identifiant.ts";

const ATTENDU = "checkout.session.completed";

export interface Livraison {
  /** L'identifiant du compte Clerk, posé en `client_reference_id` à l'achat. */
  compte: string;
  courriel: string | null;
  /** `null` si l'acheteur s'est trompé — on le préviendra plutôt que d'abandonner. */
  github: string | null;
}

export function lireLivraison(charge: unknown): Livraison | null {
  if (!charge || typeof charge !== "object") return null;

  const evenement = charge as Record<string, unknown>;
  if (evenement.type !== ATTENDU) return null;

  const session = (evenement.data as { object?: Record<string, unknown> } | undefined)?.object;
  if (!session || session.payment_status !== "paid") return null;

  const compte = session.client_reference_id;
  if (typeof compte !== "string" || !compte) return null;

  const courriel = (session.customer_details as { email?: unknown } | undefined)?.email;
  const champs = Array.isArray(session.custom_fields) ? session.custom_fields : [];
  const saisi = champs.find((c) => c?.key === "github")?.text?.value;

  return {
    compte,
    courriel: typeof courriel === "string" && courriel ? courriel : null,
    github: lireIdentifiantGithub(saisi),
  };
}
