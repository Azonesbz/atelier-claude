/**
 * Stripe tient lieu de base de données.
 *
 * Le service n'a aucune table : ni utilisateurs, ni sessions, ni abonnements
 * recopiés. La seule question posée est « cet abonnement est-il actif ? », et
 * Stripe en est déjà la source de vérité. Doubler cette source, c'est
 * fabriquer deux vérités qui divergeront.
 */

import Stripe from "stripe";

export interface EtatAbonnement {
  actif: boolean;
  /** Fin de la période payée, en ISO. Absente si aucun abonnement. */
  jusquau: string | null;
  /** `active`, `trialing`, `past_due`… — repris tel quel de Stripe. */
  statut: string | null;
}

/** Les statuts qui donnent droit à l'écriture. `past_due` reste ouvert : la */
/** carte a échoué, la personne a payé jusqu'ici — on ne la coupe pas net. */
const STATUTS_OUVERTS = new Set(["active", "trialing", "past_due"]);

let client: Stripe | null = null;

export function stripe(): Stripe {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) throw new Error("STRIPE_SECRET_KEY est absente : le service ne peut rien vérifier.");
  if (!client) client = new Stripe(cle);
  return client;
}

export async function etatDeLAbonnement(identifiantClient: string): Promise<EtatAbonnement> {
  const abonnements = await stripe().subscriptions.list({
    customer: identifiantClient,
    status: "all",
    limit: 10,
  });

  const ouvert = abonnements.data.find((a) => STATUTS_OUVERTS.has(a.status));
  if (!ouvert) {
    const dernier = abonnements.data[0];
    return { actif: false, jusquau: null, statut: dernier?.status ?? null };
  }

  const fin = ouvert.items.data[0]?.current_period_end;
  return {
    actif: true,
    jusquau: fin ? new Date(fin * 1000).toISOString() : null,
    statut: ouvert.status,
  };
}

/**
 * L'adresse du service de licence.
 *
 * En local elle pointe vers le déploiement ; sur le déploiement lui-même, vers
 * soi. Sans elle, l'application locale considère qu'il n'y a pas de licence à
 * vérifier et reste en lecture seule — jamais l'inverse.
 */
export function adresseDuService(): string | null {
  return process.env.NEXT_PUBLIC_ATELIER_SERVICE?.replace(/\/$/, "") ?? null;
}
