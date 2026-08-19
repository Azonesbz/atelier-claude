import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { estPublic, estService } from "@/lib/acces/role";

/**
 * Deux rôles, deux comportements, dans un seul fichier.
 *
 * **La racine.** Sur le déploiement public, `/` appartient au rôle local, qui y
 * est éteint — elle répondait donc 404, ce qui est inadmissible pour la racine
 * d'un domaine public. Elle mène désormais à la vitrine. En local, elle reste
 * le tableau de bord de l'application, et rien ne bouge.
 *
 * **Clerk.** Le matcher posé par `clerk init` couvre tout le site. Ici ce
 * serait une faute : sur la machine d'un acheteur, Clerk n'a rien à faire.
 * Mesuré — sans garde-fou, chaque page locale chargeait `clerk.browser.js`
 * depuis `clerk.accounts.dev` et embarquait un jeton de revendication. Pour un
 * produit dont la promesse est que rien ne sort de la machine, c'est pire
 * qu'un plantage : c'est silencieux.
 *
 * D'où deux garde-fous. Le matcher borne l'interception à des routes que le
 * rôle local n'emprunte pas ; `estService()` la supprime même sur celles-là.
 * `/api/auth/*` est absent des deux : c'est le flux OAuth local, qui n'a rien
 * à faire dans une session Clerk.
 */
const avecClerk = clerkMiddleware();

export default function proxy(requete: NextRequest, evenement: never) {
  // La racine appartient au rôle local, qui n'a JAMAIS besoin de Clerk. La
  // laisser tomber dans le middleware la faisait passer par la poignée de main,
  // et donc échouer en développement — le piège `localhost`/`::1` documenté
  // dans docs/authentification.md.
  if (requete.nextUrl.pathname === "/") {
    return estPublic() ? NextResponse.redirect(new URL("/produit", requete.url)) : undefined;
  }

  return estService() ? avecClerk(requete, evenement) : undefined;
}

export const config = {
  matcher: [
    // La racine, pour la rediriger vers la vitrine en ligne.
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/compte(.*)",
    "/admin(.*)",
    // La page qui vend et les pages légales portent l'en-tête de compte, donc
    // elles ont besoin d'une session pour savoir quoi afficher. Absentes d'ici,
    // `auth()` lève et la page rend 500 — c'est une liste blanche, pas un
    // filtre.
    "/produit(.*)",
    "/tarif(.*)",
    "/merci(.*)",
    "/mentions(.*)",
    "/cgv(.*)",
    "/confidentialite(.*)",
    // Le paiement a besoin de savoir QUI achète, donc d'une session Clerk.
    "/api/paiement(.*)",
    // `/api/droit` et `/api/stripe/webhook` en sont volontairement absents :
    // l'un s'authentifie par jeton porteur, l'autre par signature Stripe.
    // La voie de service de Clerk, requise par son proxy automatique.
    "/__clerk/:path*",
  ],
};
