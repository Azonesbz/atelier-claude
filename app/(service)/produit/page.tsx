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
import { OffreTarif } from "@/components/landing/OffreTarif";
import { Reassurance } from "@/components/landing/Reassurance";
import { estService } from "@/lib/acces/role";
import { lireMontantAffiche } from "@/lib/licence/tarif";

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
 * Elle **mène** au tunnel de paiement sans le refaire : tout finit sur
 * `/tarif`, qui porte l'offre et le bouton Stripe. Dupliquer le tunnel ici
 * aurait fabriqué deux vérités sur le prix, et c'est exactement ce que la
 * fiche du produit interdit.
 *
 * L'ordre des sections n'est pas un goût : il vient de l'analyse de dix pages
 * qui vendent contre dix qui ne vendent pas, dans cette niche précise. Chaque
 * section a un job, et une section sans job n'entre pas.
 */
export default async function Produit() {
  // Sur la machine d'un acheteur il n'y a pas de `ClerkProvider` : l'en-tête
  // de compte lèverait. Cette page n'existe que sur le service.
  if (!estService()) notFound();

  // Le montant vit dans le tarif Stripe, jamais dans le code. `null` tant
  // qu'aucun tarif n'est créé — le bouton perd alors son prix, sans mentir.
  const montant = await lireMontantAffiche();

  return (
    <main>
      <EnteteService />

      <Heros montant={montant} />
      <Compatibilite />
      <Reassurance />
      <Demonstration montant={montant} />
      <Credibilite />
      <MiseEnRoute />
      <OffreTarif montant={montant} />
      <Objections />
      <Auteur />
      <AppelFinal montant={montant} />
    </main>
  );
}
