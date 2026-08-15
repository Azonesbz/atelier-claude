import { clientDeLaCle } from "@/lib/licence/cle";
import { etatDeLAbonnement } from "@/lib/licence/stripe";

/**
 * La vérification d'une clé. C'est tout ce que le service expose en lecture.
 *
 * Aucune donnée personnelle ne transite : la clé porte un identifiant client
 * Stripe, la réponse dit oui ou non et jusqu'à quand. Rien du dossier .claude
 * de qui que ce soit n'arrive jamais ici.
 */
export async function GET(requete: Request) {
  const cle = new URL(requete.url).searchParams.get("cle") ?? "";
  const client = clientDeLaCle(cle);

  if (!client) {
    return Response.json({ valide: false, raison: "Clé illisible ou signature invalide." });
  }

  try {
    const etat = await etatDeLAbonnement(client);
    return Response.json({ valide: etat.actif, jusquau: etat.jusquau, statut: etat.statut });
  } catch {
    // Une panne de Stripe n'est pas un refus : l'application locale a un cache
    // tolérant, et lui répondre « invalide » couperait l'écriture à tort.
    return Response.json({ valide: null, raison: "Service indisponible." }, { status: 503 });
  }
}
