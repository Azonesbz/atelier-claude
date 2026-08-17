import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnteteService } from "@/components/EnteteService";
import { estService } from "@/lib/acces/role";
import { clientDuCompte } from "@/lib/acces/rattachement";
import { etatDuPaiement } from "@/lib/licence/stripe";

export const dynamic = "force-dynamic";

/**
 * L'espace client, côté service.
 *
 * Il ne montre qu'une chose, parce qu'il n'y a qu'une chose à savoir : l'achat
 * existe-t-il. Aucun dossier `.claude` n'arrive jamais ici, et Stripe reste la
 * source de vérité — cette page ne fait que la lire.
 */
export default async function EspaceClient() {
  if (!estService()) notFound();

  const { userId } = await auth();
  if (!userId) {
    return (
      <main className="mx-auto max-w-xl">
        <EnteteService />
        <h1 className="font-display text-3xl">Mon compte</h1>
        <p className="mt-3 text-sm text-muted">
          Connecte-toi pour retrouver ton achat.
        </p>
      </main>
    );
  }

  const utilisateur = await currentUser();
  const achat = await lireAchat(userId);

  return (
    <main className="mx-auto max-w-xl">
      <EnteteService />
      <h1 className="font-display text-3xl">Mon compte</h1>
      <p className="mt-2 font-mono text-xs text-muted">
        {utilisateur?.primaryEmailAddress?.emailAddress ?? "—"}
      </p>

      <section className="card mt-6 p-5">
        <span className="surtitre">Achat</span>
        <p className={`mt-2 text-xl font-semibold ${achat.paye ? "text-ink" : "text-muted"}`}>
          {achat.paye ? "Actif" : "Aucun achat"}
        </p>
        <p className="mt-1 text-sm text-muted">{achat.detail}</p>

        {!achat.paye && (
          <Link href="/tarif" className="btn-primary mt-4 inline-flex">
            Voir l&apos;offre
          </Link>
        )}
      </section>

      <p className="mt-4 text-xs text-muted">
        L&apos;écriture s&apos;ouvre toute seule dans l&apos;application, sur cette machine, dès
        que tu y es connecté au même compte. Rien à copier.
      </p>
    </main>
  );
}

async function lireAchat(compte: string): Promise<{ paye: boolean; detail: string }> {
  try {
    const client = await clientDuCompte(compte);
    if (!client) return { paye: false, detail: "Ce compte n'a encore rien acheté." };

    const etat = await etatDuPaiement(client);
    if (etat.paye) {
      const quand = etat.le ? new Date(etat.le).toLocaleDateString("fr-FR") : "—";
      return { paye: true, detail: `Acheté le ${quand}. Perpétuel, mises à jour comprises.` };
    }
    return {
      paye: false,
      detail: etat.raison === "rembourse" ? "Cet achat a été remboursé." : "Aucun paiement trouvé.",
    };
  } catch {
    return { paye: false, detail: "Le service de paiement ne répond pas. Réessaie dans un moment." };
  }
}
