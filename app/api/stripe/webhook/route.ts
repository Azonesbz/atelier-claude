import { lireLivraison } from "@/lib/livraison/evenement";
import { stripe } from "@/lib/licence/stripe";

/**
 * Le webhook de paiement : c'est lui qui livre l'accès au dépôt.
 *
 * La signature est vérifiée sur le corps **brut**. Toute transformation avant
 * la vérification la casse — d'où `req.text()` et non `req.json()`.
 *
 * Sans signature valide, on refuse : cette route est publique, et quiconque
 * pourrait sinon s'offrir l'accès en postant un faux événement.
 *
 * On répond 200 même quand l'invitation échoue. Un 500 ferait rejouer Stripe
 * indéfiniment pour une faute de frappe dans un identifiant GitHub, que le
 * rejeu ne corrigera jamais — l'acheteur se répare depuis sa page Compte.
 */
export async function POST(requete: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = requete.headers.get("stripe-signature");
  if (!secret || !signature) {
    return Response.json({ erreur: "Signature requise." }, { status: 400 });
  }

  let evenement: unknown;
  try {
    evenement = stripe().webhooks.constructEvent(await requete.text(), signature, secret);
  } catch {
    return Response.json({ erreur: "Signature invalide." }, { status: 400 });
  }

  const livraison = lireLivraison(evenement);
  if (!livraison) return Response.json({ recu: true, action: "aucune" });

  /* Plus rien à livrer depuis le 19 août 2026 : le logiciel est open source et
     s'installe par `npx orcha-cli`. Ce qui s'achète est le droit d'écrire, que
     `/api/droit` accorde en interrogeant Stripe — sans qu'aucun webhook n'ait
     à intervenir. La route reste pour tracer, et parce qu'un endpoint déclaré
     chez Stripe qui disparaîtrait ferait accumuler les échecs de livraison. */
  return Response.json({ recu: true, action: "achat-constate", compte: livraison.compte });
}
