import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Outfit, Pacifico } from "next/font/google";
import { estService } from "@/lib/acces/role";
import "./globals.css";

/* Les deux polices du portfolio. Outfit porte tout le texte ; Pacifico ne sert
   qu'au nom et aux nombres des tuiles. */
const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display-family",
});

export const metadata: Metadata = {
  title: "Atelier Claude",
  description: "Voir et modifier un dossier .claude",
};

/**
 * La coquille de l'application.
 *
 * Elle ne fait que le strict minimum commun aux deux rôles : la langue, les
 * polices, et `ClerkProvider` quand il y a lieu. La mise en page appartient
 * aux coquilles — `(local)` pour l'application, `(service)` pour ce qui est
 * public. Elles ne veulent pas la même chose, et les mélanger ici imposerait
 * le chrome fixe d'un logiciel à une page qui doit défiler.
 */
/**
 * `ClerkProvider` seulement là où Clerk existe.
 *
 * Il lève sans clé publiable. Posé sans condition — ce que fait l'installation
 * par défaut — il éteindrait l'application chez tout acheteur, y compris pour
 * la lecture, qui est gratuite. Le rôle local n'a pas de compte à fournir : il
 * se connecte par le flux OAuth de `lib/acces`, pas par une session Clerk.
 */
function Enveloppe({ children }: { children: React.ReactNode }) {
  return estService() ? <ClerkProvider>{children}</ClerkProvider> : <>{children}</>;
}

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${pacifico.variable}`}>
      {/* Ni hauteur ni débordement ici : l'application locale veut un chrome fixe,
          la page qui vend veut le défilement naturel du document. Chaque
          coquille pose le sien. */}
      <body className="antialiased">
        <Enveloppe>{children}</Enveloppe>
      </body>
    </html>
  );
}
