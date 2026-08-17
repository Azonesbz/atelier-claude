import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Outfit, Pacifico } from "next/font/google";
import { Rail } from "@/components/Rail";
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
 * Ce n'est pas un site : `h-dvh` et `overflow-hidden` sur le corps, une seule
 * zone qui défile, le chrome fixe. La colonne centrée à grandes marges d'un
 * site gaspillerait la fenêtre — et ne survivrait pas à un empaquetage en
 * logiciel, où l'application occupe ce qu'on lui donne.
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
      <body className="h-dvh overflow-hidden antialiased">
        <Enveloppe>
          <div className="flex h-full flex-col md:flex-row">
            <Rail />
            <div className="relative min-w-0 flex-1 overflow-y-auto">
              <div aria-hidden className="fond-grille" />
              {/* Une application occupe ce qu'on lui donne. La borne haute évite
                  seulement les lignes à rallonge sur un très grand écran. */}
              <div className="relative z-10 mx-auto max-w-[100rem] px-5 py-6 sm:px-8 sm:py-8">
                {children}
              </div>
            </div>
          </div>
        </Enveloppe>
      </body>
    </html>
  );
}
