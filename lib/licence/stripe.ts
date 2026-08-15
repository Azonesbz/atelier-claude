/**
 * Stripe tient lieu de base de données.
 *
 * Le service n'a aucune table : ni utilisateurs, ni sessions, ni paiements
 * recopiés. La seule question posée est « ce client a-t-il payé, sans avoir été
 * remboursé ? », et Stripe en est déjà la source de vérité. En doubler une
 * seconde, ce serait fabriquer deux vérités qui divergeront.
 */

import Stripe from "stripe";

export interface EtatPaiement {
  /** Vrai si un paiement réussi et non remboursé existe. */
  paye: boolean;
  /** Date du paiement, en ISO. Sert à dire « acheté le… », rien de plus. */
  le: string | null;
  /** `rembourse` quand un achat a existé puis a été annulé. */
  raison: "aucun-paiement" | "rembourse" | null;
}

let client: Stripe | null = null;

export function stripe(): Stripe {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) throw new Error("STRIPE_SECRET_KEY est absente : le service ne peut rien vérifier.");
  if (!client) client = new Stripe(cle);
  return client;
}

/**
 * Un achat unique et définitif : la licence ne périme pas.
 *
 * Seul un remboursement la retire — c'est la contrepartie normale d'un
 * paiement rendu, et la seule raison de dire non à quelqu'un qui a payé.
 */
export async function etatDuPaiement(identifiantClient: string): Promise<EtatPaiement> {
  const charges = await stripe().charges.list({ customer: identifiantClient, limit: 20 });

  const reussie = charges.data.find((c) => c.paid && c.status === "succeeded" && !c.refunded);
  if (reussie) {
    return { paye: true, le: new Date(reussie.created * 1000).toISOString(), raison: null };
  }

  const remboursee = charges.data.some((c) => c.refunded);
  return { paye: false, le: null, raison: remboursee ? "rembourse" : "aucun-paiement" };
}

/**
 * L'adresse du service de licence.
 *
 * En local elle pointe vers le déploiement ; sur le déploiement lui-même, vers
 * soi. Sans elle, l'application locale considère qu'il n'y a rien à vérifier et
 * reste en lecture seule — jamais l'inverse.
 */
export function adresseDuService(): string | null {
  return process.env.NEXT_PUBLIC_ATELIER_SERVICE?.replace(/\/$/, "") ?? null;
}
