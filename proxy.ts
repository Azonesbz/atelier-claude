import { type NextRequest, NextResponse } from "next/server";
import { estPublic } from "@/lib/acces/role";

/**
 * La racine, selon le rôle.
 *
 * En ligne, `/` appartient au rôle local — qui y est éteint — et répondrait
 * donc 404 : inadmissible pour la racine d'un domaine public. Elle mène à la
 * vitrine. En local, elle reste le tableau de bord, et rien ne bouge.
 *
 * Il n'y a plus rien d'autre à intercepter : le produit est libre, il n'a ni
 * compte, ni session, ni paiement à contrôler.
 */
export default function proxy(requete: NextRequest) {
  if (estPublic() && requete.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/produit", requete.url));
  }
  return undefined;
}

export const config = { matcher: ["/"] };
