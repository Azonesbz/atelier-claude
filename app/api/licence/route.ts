import { clientDeLaCle } from "@/lib/licence/cle";
import { etatDuPaiement } from "@/lib/licence/stripe";

/**
 * La vérification d'une clé. C'est tout ce que le service expose en lecture.
 *
 * Aucune donnée personnelle ne transite : la clé porte un identifiant client
 * Stripe, la réponse dit oui ou non. Rien du dossier .claude de qui que ce soit
 * n'arrive jamais ici.
 */
export async function GET(requete: Request) {
  const cle = new URL(requete.url).searchParams.get("cle") ?? "";
  const client = clientDeLaCle(cle);

  if (!client) {
    return Response.json({ valide: false, raison: "Clé illisible ou signature invalide." });
  }

  try {
    const etat = await etatDuPaiement(client);
    return Response.json({
      valide: etat.paye,
      achetéLe: etat.le,
      raison:
        etat.raison === "rembourse"
          ? "Cet achat a été remboursé."
          : etat.raison === "aucun-paiement"
            ? "Aucun paiement trouvé pour cette clé."
            : null,
    });
  } catch {
    // Une panne de Stripe n'est pas un refus : l'application locale a un cache
    // tolérant, et lui répondre « invalide » couperait l'écriture à tort.
    return Response.json({ valide: null, raison: "Service indisponible." }, { status: 503 });
  }
}
