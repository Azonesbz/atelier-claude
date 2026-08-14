import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier Claude",
  description: "Voir et modifier un dossier .claude sur une page",
};

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
      </body>
    </html>
  );
}
