import { fabriquerCle } from "@/lib/licence/cle";
import { stripe } from "@/lib/licence/stripe";

export const dynamic = "force-dynamic";

/**
 * La page d'après-paiement, côté service.
 *
 * La clé est fabriquée ici, à partir de la session Stripe. Elle n'est stockée
 * nulle part : elle se recalcule à l'identique tant que le client existe, donc
 * la perdre n'est pas une catastrophe — il suffit de repasser par le portail.
 */
export default async function Merci({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const cle = session ? await cleDeLaSession(session) : null;

  return (
    <main className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl">Merci</h1>
      {cle ? (
        <>
          <p className="mt-3 text-sm text-muted">
            Voici ta clé de licence. Colle-la dans l&apos;application, page « Licence ». Elle est
            liée à ton achat, elle ne périme pas, et se retrouve toujours en repassant
            par ce lien.
          </p>
          <pre className="card mt-4 overflow-x-auto p-4 font-mono text-sm select-all">{cle}</pre>
        </>
      ) : (
        <p className="mt-3 text-sm text-danger">
          Session de paiement introuvable. Si le débit a eu lieu, écris-moi : la clé se
          reconstruit à partir de ton compte Stripe.
        </p>
      )}
    </main>
  );
}

async function cleDeLaSession(identifiant: string): Promise<string | null> {
  try {
    const session = await stripe().checkout.sessions.retrieve(identifiant);
    const client = typeof session.customer === "string" ? session.customer : session.customer?.id;
    return client ? fabriquerCle(client) : null;
  } catch {
    return null;
  }
}
