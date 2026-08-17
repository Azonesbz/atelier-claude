import { auth, currentUser } from "@clerk/nextjs/server";
import { adresseDuService, stripe } from "@/lib/licence/stripe";
import { rattacherClient } from "@/lib/acces/rattachement";

/**
 * Ouvre une session de paiement Stripe et renvoie l'adresse où aller.
 *
 * Aucune donnée de carte ne passe par ici : c'est Stripe qui héberge le
 * formulaire, et l'application n'en voit jamais le contenu.
 *
 * L'achat est **rattaché au compte connecté**, sans quoi rien ne relierait un
 * paiement à une personne et la question « a-t-elle payé ? » n'aurait pas de
 * réponse. C'est aussi pourquoi cette route exige d'être connecté : payer sans
 * compte produirait un achat orphelin, impossible à faire valoir.
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

  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { erreur: "Il faut un compte pour acheter : sans lui, l'achat ne pourrait être rattaché à personne." },
      { status: 401 },
    );
  }

  try {
    const utilisateur = await currentUser();
    const client = await rattacherClient(
      userId,
      utilisateur?.primaryEmailAddress?.emailAddress ?? undefined,
    );

    const session = await stripe().checkout.sessions.create({
      // Achat unique : la licence est perpétuelle, mises à jour comprises.
      mode: "payment",
      customer: client,
      client_reference_id: userId,
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
