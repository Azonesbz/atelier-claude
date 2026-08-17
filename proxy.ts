import { clerkMiddleware } from "@clerk/nextjs/server";
import { estService } from "@/lib/acces/role";

/**
 * Clerk ne voit que les routes du service. Jamais l'application locale.
 *
 * Le matcher posé par `clerk init` couvre tout le site. Ici ce serait une
 * faute : la même base de code tient deux rôles, et sur la machine d'un
 * acheteur Clerk n'a rien à faire.
 *
 * Mesuré, et c'est la vraie raison : sans garde-fou, sur une machine sans
 * aucune clé Clerk, chaque page de l'application locale chargeait
 * `clerk.browser.js` depuis `clerk.accounts.dev` et embarquait un jeton de
 * revendication vers `clerk.com`. Pour un produit dont la promesse est que rien
 * ne sort de la machine, c'est pire qu'un plantage : c'est silencieux.
 *
 * D'où deux garde-fous. Le matcher borne l'interception à des routes que le
 * rôle local n'emprunte pas ; `estService()` la supprime même sur celles-là.
 * `/api/auth/*` est absent des deux : c'est le flux OAuth local, qui n'a rien à
 * faire dans une session Clerk.
 */
const traverser = () => undefined;

export default estService() ? clerkMiddleware() : traverser;

export const config = {
  matcher: [
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/compte(.*)",
    // La page qui vend : elle porte l'en-tête de compte, donc elle a besoin
    // d'une session pour savoir quoi afficher. Absente d'ici, `auth()` lève et
    // la page rend une erreur 500 — c'est une liste blanche, pas un filtre.
    "/produit(.*)",
    "/tarif(.*)",
    "/merci(.*)",
    // Le paiement a besoin de savoir QUI achète, donc d'une session Clerk.
    "/api/paiement(.*)",
    // `/api/droit` en est volontairement absent : il s'authentifie par jeton
    // porteur, pas par session, et une poignée de main y serait parasite.
    // La voie de service de Clerk, requise par son proxy automatique.
    "/__clerk/:path*",
  ],
};
