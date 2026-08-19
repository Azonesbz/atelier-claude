import { clerkClient, currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormulaireFaveur } from "./Formulaire";
import { EnteteService } from "@/components/EnteteService";
import { CHAMP_FAVEUR, estAdmin, estOffert } from "@/lib/acces/faveur";
import { estService } from "@/lib/acces/role";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration — Orcha" };

/**
 * L'espace d'administration : offrir l'outil à qui on veut.
 *
 * `notFound()` plutôt qu'un refus explicite pour qui n'est pas administrateur.
 * Une page qui répond « interdit » confirme son existence ; celle-ci n'existe
 * pas pour les autres.
 *
 * Le contrôle est refait dans l'action serveur : cette page ne protège que
 * l'affichage, et une action est atteignable sans elle.
 */
export default async function Administration() {
  if (!estService()) notFound();

  const moi = await currentUser();
  if (!estAdmin(moi?.primaryEmailAddress?.emailAddress)) notFound();

  const beneficiaires = await lireBeneficiaires();

  return (
    <main className="mx-auto max-w-2xl">
      <EnteteService />

      <h1 className="font-display text-3xl">Administration</h1>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Offrir l&apos;accès à quelqu&apos;un sans passer par la caisse. Le droit s&apos;ouvre
        immédiatement, sans paiement à rembourser ensuite.
      </p>

      <section className="card mt-6 p-5">
        <span className="surtitre">Offrir l&apos;accès</span>
        <p className="mt-2 text-sm text-muted">
          La personne doit d&apos;abord avoir créé son compte&nbsp;: on offre à un compte
          existant, pas à une adresse dans le vide.
        </p>
        <FormulaireFaveur />
      </section>

      <section className="card mt-3 p-5">
        <span className="surtitre">Accès offerts — {beneficiaires.length}</span>
        {beneficiaires.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Personne pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 font-mono text-sm text-ink-soft">
            {beneficiaires.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/** Les comptes portant la faveur. La liste reste courte par nature. */
async function lireBeneficiaires(): Promise<string[]> {
  try {
    const clerk = await clerkClient();
    const { data } = await clerk.users.getUserList({ limit: 200 });
    return data
      .filter((u) => estOffert(u.publicMetadata))
      .map((u) => u.primaryEmailAddress?.emailAddress ?? u.id);
  } catch {
    return [];
  }
}
