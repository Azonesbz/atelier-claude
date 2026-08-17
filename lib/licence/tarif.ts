/**
 * Le montant, lu chez Stripe au rendu — jamais recopié ici.
 *
 * La fiche du produit pose que « le montant n'existe nulle part dans le
 * code : il vit dans le tarif Stripe, donc il se change sans redéployer ».
 * La page qui vend pose l'inverse : chez les quatre vendeurs sans marque du
 * panel concurrent, le prix est dans le libellé du bouton, sans exception.
 *
 * Les deux tiennent si le montant est *lu*, pas écrit. Le tarif reste la
 * source de vérité ; la page n'en est qu'un miroir, rafraîchi à chaque rendu
 * — les pages du service sont déjà en `force-dynamic`.
 *
 * Absent, illisible ou injoignable : on rend `null` et le bouton perd son
 * montant. Jamais de prix de repli — un prix faux sur un bouton d'achat est
 * pire qu'un bouton sans prix.
 */

import { stripe } from "./stripe.ts";

/**
 * Centimes Stripe → libellé français.
 *
 * Le zéro décimal se tait : sur un bouton, « 39 € » se lit d'un coup d'œil là
 * où « 39,00 € » fait comptable.
 */
export function formaterMontant(centimes: number, devise: string): string {
  const rond = centimes % 100 === 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise.toUpperCase(),
    minimumFractionDigits: rond ? 0 : 2,
  }).format(centimes / 100);
}

/**
 * Le montant à afficher, ou `null` s'il n'est pas connu de façon certaine.
 *
 * On avale l'erreur volontairement : Stripe injoignable doit coûter un
 * montant manquant, pas une landing page en écran blanc.
 */
export async function lireMontantAffiche(): Promise<string | null> {
  const tarif = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  if (!tarif) return null;

  try {
    const prix = await stripe().prices.retrieve(tarif);
    if (prix.unit_amount === null || prix.unit_amount === undefined) return null;
    return formaterMontant(prix.unit_amount, prix.currency);
  } catch {
    return null;
  }
}
