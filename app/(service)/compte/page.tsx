import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reparation } from "./Reparation";
import { EnteteService } from "@/components/EnteteService";
import { estAdmin } from "@/lib/acces/faveur";
import { estService } from "@/lib/acces/role";
import { verdictDuCompte } from "@/lib/acces/verdict";

export const dynamic = "force-dynamic";

/**
 * Le tableau de bord du compte, côté service.
 *
 * C'est là qu'on atterrit en se connectant — la racine appartient au rôle
 * local et répond 404 ici. Il montre ce que le compte ouvre, d'où vient ce
 * droit, et comment récupérer l'outil.
 */
export default async function EspaceClient() {
  if (!estService()) notFound();

  const { userId } = await auth();
  if (!userId) return <Invite />;

  const utilisateur = await currentUser();
  const courriel = utilisateur?.primaryEmailAddress?.emailAddress ?? null;
  const verdict = await verdictDuCompte(userId).catch(() => null);

  return (
    <main className="mx-auto max-w-2xl">
      <EnteteService />

      <h1 className="font-display text-3xl">Mon compte</h1>
      <p className="mt-2 font-mono text-xs text-muted">{courriel ?? "—"}</p>

      <section className="card mt-6 p-5">
        <span className="surtitre">Écriture</span>
        <p className={`mt-2 text-xl font-semibold ${verdict?.droit ? "text-ink" : "text-muted"}`}>
          {verdict?.droit ? "Débloquée" : "Verrouillée"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {verdict ? verdict.detail : "Le service de paiement ne répond pas. Réessaie plus tard."}
          {verdict?.achatLe && ` Acheté le ${new Date(verdict.achatLe).toLocaleDateString("fr-FR")}.`}
        </p>

        {!verdict?.droit && (
          <Link href="/tarif" className="btn-primary mt-4 inline-flex">
            Voir l&apos;offre
          </Link>
        )}
      </section>

      {verdict?.droit && (
        <>
          <section className="card mt-3 p-5">
            <span className="surtitre">Ce que ça ouvre</span>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              <li>Éditer une compétence depuis l&apos;interface</li>
              <li>Ajouter, retirer, renuméroter des étapes de workflow</li>
              <li>Créer et brancher des sous-agents</li>
              <li>Mises à jour comprises, sans limite de durée</li>
            </ul>
          </section>

          <section className="card mt-3 p-5">
            <span className="surtitre">Récupérer l&apos;outil</span>
            <p className="mt-2 text-sm text-muted">
              Le dépôt est privé&nbsp;: l&apos;accès se donne par invitation GitHub. Elle part
              automatiquement à l&apos;achat — si tu t&apos;es trompé d&apos;identifiant, renvoie-la.
            </p>
            <Reparation dejaInvite={null} />
          </section>
        </>
      )}

      {estAdmin(courriel) && (
        <p className="mt-4 text-xs">
          <Link href="/admin" className="text-ink underline underline-offset-4">
            Espace d&apos;administration →
          </Link>
        </p>
      )}
    </main>
  );
}

function Invite() {
  return (
    <main className="mx-auto max-w-2xl">
      <EnteteService />
      <h1 className="font-display text-3xl">Mon compte</h1>
      <p className="mt-3 text-sm text-muted">Connecte-toi pour retrouver ton achat.</p>
    </main>
  );
}
