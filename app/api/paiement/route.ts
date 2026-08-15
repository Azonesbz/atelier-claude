import { adresseDuService, stripe } from "@/lib/licence/stripe";

/**
 * Ouvre une session de paiement Stripe et renvoie l'adresse où aller.
 *
 * Aucune donnée de carte ne passe par ici : c'est Stripe qui héberge le
 * formulaire, et l'application n'en voit jamais le contenu.
 */
export async function POST() {
  const tarif = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  const base = adresseDuService();

  if (!tarif || !base) {
    return Response.json(
      { erreur: "Le service n'est pas configuré : NEXT_PUBLIC_STRIPE_PRICE_ID ou NEXT_PUBLIC_ATELIER_SERVICE manque." },
      { status: 500 },
    );
  }

  try {
    const session = await stripe().checkout.sessions.create({
      // Achat unique : la licence est perpétuelle, mises à jour comprises.
      mode: "payment",
      line_items: [{ price: tarif, quantity: 1 }],
      success_url: `${base}/merci?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/tarif`,
      allow_promotion_codes: true,
    });
    return Response.json({ url: session.url });
  } catch (erreur) {
    return Response.json(
      { erreur: erreur instanceof Error ? erreur.message : "Paiement impossible." },
      { status: 502 },
    );
  }
}
