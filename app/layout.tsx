import type { Metadata } from "next";
import { Dock } from "@/components/Dock";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier Claude",
  description: "Voir et modifier un dossier .claude sur une page",
};

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-[80rem] px-4 pb-16 sm:px-6">
          <Dock />
          {children}
        </div>
      </body>
    </html>
  );
}
