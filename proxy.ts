import { clerkMiddleware } from "@clerk/nextjs/server";
import { estService } from "@/lib/acces/role";

/**
 * Clerk ne voit que les routes du service. Jamais l'application locale.
 *
 * Le matcher posé par `clerk init` couvre tout le site. Ici ce serait une
 * faute : la même base de code tient deux rôles, et sur la machine d'un
 * acheteur `clerkMiddleware()` lève faute de clés — chaque page interceptée
 * répondrait 500, y compris celles qui ne font que lire, qui sont gratuites.
 *
 * D'où deux garde-fous plutôt qu'un. Le matcher limite la casse à des routes
 * que le rôle local n'emprunte pas ; le prédicat la supprime même sur
 * celles-là. `/api/auth/*` est absent des deux : c'est le flux OAuth local, qui
 * n'a rien à faire dans une session Clerk.
 */
const traverser = () => undefined;

export default estService() ? clerkMiddleware() : traverser;

export const config = {
  matcher: [
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/compte(.*)",
    "/tarif(.*)",
    "/merci(.*)",
    "/api/paiement(.*)",
    "/api/droit(.*)",
    // La voie de service de Clerk, requise par son proxy automatique.
    "/__clerk/:path*",
  ],
};
