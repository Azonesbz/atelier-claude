/**
 * Le verdict sur le droit d'écrire d'un compte, côté service.
 *
 * Deux sources, dans cet ordre : la faveur de l'administrateur, puis le
 * paiement. La faveur passe en premier parce qu'elle est instantanée et sans
 * appel réseau — inutile d'interroger Stripe pour quelqu'un à qui on a donné
 * l'outil.
 *
 * Rassemblé ici plutôt que dispersé dans les routes : `/api/droit` et la page
 * Compte posent la même question, et deux réponses qui divergeraient seraient
 * pires qu'une seule fausse.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { estOffert } from "./faveur.ts";
import { clientDuCompte } from "./rattachement.ts";
import { etatDuPaiement } from "../licence/stripe.ts";

export interface Verdict {
  droit: boolean;
  /** D'où vient le droit — l'interface le dit à l'acheteur. */
  source: "faveur" | "achat" | "aucune";
  detail: string;
  achatLe: string | null;
}

const REFUS = { droit: false, source: "aucune", achatLe: null } as const;

export async function verdictDuCompte(compte: string): Promise<Verdict> {
  if (await faveurAccordee(compte)) {
    return { droit: true, source: "faveur", detail: "Accès offert par l'éditeur.", achatLe: null };
  }

  try {
    const client = await clientDuCompte(compte);
    if (!client) return { ...REFUS, detail: "Aucun achat pour ce compte." };

    const etat = await etatDuPaiement(client);
    if (etat.paye) {
      return { droit: true, source: "achat", detail: "Achat vérifié.", achatLe: etat.le };
    }
    return {
      ...REFUS,
      detail: etat.raison === "rembourse" ? "Cet achat a été remboursé." : "Aucun achat pour ce compte.",
    };
  } catch {
    // Une panne de Stripe n'est pas un refus : l'appelant la distingue.
    throw new Error("service-indisponible");
  }
}

async function faveurAccordee(compte: string): Promise<boolean> {
  try {
    const utilisateur = await (await clerkClient()).users.getUser(compte);
    return estOffert(utilisateur.publicMetadata);
  } catch {
    return false;
  }
}
