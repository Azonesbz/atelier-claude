import type { Metadata } from "next";
import { Outfit, Pacifico } from "next/font/google";
import { Dock } from "@/components/Dock";
import "./globals.css";

/* Les deux polices du portfolio. Outfit porte tout le texte ; Pacifico ne sert
   qu'au nom, comme ailleurs — une police d'affichage sur du contenu dense se
   lit mal. */
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display-family",
});

export const metadata: Metadata = {
  title: "Atelier Claude",
  description: "Voir et modifier un dossier .claude sur une page",
};

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${pacifico.variable}`}>
      <body className="min-h-screen antialiased">
        <div aria-hidden className="fond-grille" />
        <div className="relative z-10 mx-auto max-w-[80rem] px-4 pb-16 sm:px-6">
          <Dock />
          {children}
        </div>
      </body>
    </html>
  );
}
