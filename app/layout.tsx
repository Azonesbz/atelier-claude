import type { Metadata } from "next";
import { Outfit, Pacifico } from "next/font/google";
import { Rail } from "@/components/Rail";
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
export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${pacifico.variable}`}>
      <body className="h-dvh overflow-hidden antialiased">
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
      </body>
    </html>
  );
}
