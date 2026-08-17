import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

/**
 * Les contrôles de compte, sur les pages du service uniquement.
 *
 * Ils n'ont pas leur place dans la navigation de l'application locale : elle
 * tourne chez l'acheteur, sans `ClerkProvider` et sans compte à afficher. Les
 * y mettre ferait entrer Clerk là où le produit promet que rien ne sort de la
 * machine.
 */
export function EnteteService() {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      {/* Le nom ramène à la page qui présente le produit, pas à la caisse :
          depuis `/merci` ou `/compte`, renvoyer vers `/tarif` proposait de
          racheter ce qu'on venait d'acheter. */}
      <Link href="/produit" className="font-display text-xl">
        Orcha
      </Link>

      <nav className="flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button type="button" className="btn-ghost">
              Se connecter
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="btn-secondary">
              Créer un compte
            </button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <Link href="/compte" className="btn-ghost">
            Mon compte
          </Link>
          <UserButton />
        </Show>
      </nav>
    </header>
  );
}
