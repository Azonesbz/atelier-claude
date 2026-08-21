import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnteteService } from "@/components/EnteteService";
import { AppelFinal } from "@/components/landing/AppelFinal";
import { Auteur } from "@/components/landing/Auteur";
import { Compatibilite } from "@/components/landing/Compatibilite";
import { Credibilite } from "@/components/landing/Credibilite";
import { Demonstration } from "@/components/landing/Demonstration";
import { Heros } from "@/components/landing/Heros";
import { MiseEnRoute } from "@/components/landing/MiseEnRoute";
import { Objections } from "@/components/landing/Objections";
import { PiedService } from "@/components/landing/PiedService";
import { estPublic } from "@/lib/acces/role";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orcha — ce que ton .claude déclare, et ce qui charge vraiment",
  description:
    "Un plugin déclaré dont le code a disparu, un agent sans description, une étape de workflow dont le fichier manque : Claude Code les accepte en silence. Orcha fait la soustraction. Lecture gratuite, écriture sur achat unique.",
};

/**
 * La page qui vend, côté service.
 *
 * Elle ne peut pas vivre à la racine : `app/(local)/page.tsx` occupe déjà `/`,
 * et deux groupes de routes qui revendiquent le même chemin font échouer le
 * build — vérifié, pas supposé. D'où cette route dédiée.
 *
 * L'ordre des sections n'est pas un goût : il vient de l'analyse de dix pages
 * qui vendent contre dix qui ne vendent pas, dans cette niche précise. Chaque
 * section a un job, et une section sans job n'entre pas.
 */
export default function Produit() {
  // Ces pages sont celles du site public : elles n'ont rien à faire chez
  // quelqu'un qui a lancé l'outil sur sa propre machine.
  if (!estPublic()) notFound();


  return (
    <main>
      <EnteteService />

      <Heros />
      <Compatibilite />
      <Demonstration />
      <Credibilite />
      <MiseEnRoute />
      <Objections />
      <Auteur />
      <AppelFinal />
      <PiedService />
    </main>
  );
}
