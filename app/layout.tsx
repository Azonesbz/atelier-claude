import type { Metadata } from "next";
import { Outfit, Pacifico } from "next/font/google";
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
  title: "Orcha",
  description: "Voir et modifier un dossier .claude",
};

/**
 * La coquille de l'application.
 *
 * Elle ne fait que le strict minimum commun aux deux rôles : la langue et les
 * polices. La mise en page appartient aux coquilles — `(local)` pour
 * l'application, `(service)` pour ce qui est public. Elles ne veulent pas la
 * même chose, et les mélanger ici imposerait le chrome fixe d'un logiciel à
 * une page qui doit défiler.
 */
export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${pacifico.variable}`}>
      {/* Ni hauteur ni débordement ici : l'application locale veut un chrome
          fixe, la page publique le défilement naturel du document. Chaque
          coquille pose le sien. */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
