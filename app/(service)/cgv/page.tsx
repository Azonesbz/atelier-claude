import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARemplir, ChampARemplir } from "@/components/landing/ARemplir";
import { PageLegale, Section } from "@/components/landing/PageLegale";
import { estService } from "@/lib/acces/role";
import { lireMontantAffiche } from "@/lib/licence/tarif";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conditions générales de vente — Orcha" };

/**
 * Les conditions de vente.
 *
 * Elles décrivent le produit tel qu'il fonctionne réellement — achat unique,
 * livraison par invitation GitHub, droit d'écriture qui ne se referme que sur
 * remboursement. Une clause qui décrirait autre chose que le code serait pire
 * qu'absente : elle promettrait ce que le produit ne fait pas.
 *
 * Le prix vient de Stripe, jamais d'une constante : deux prix qui divergent,
 * c'est un litige.
 */
export default async function Cgv() {
  if (!estService()) notFound();
  const montant = await lireMontantAffiche();

  return (
    <PageLegale titre="Conditions générales de vente" miseAJour="19 août 2026">
      <Section titre="Objet">
        <p>
          Les présentes conditions régissent la vente de la licence d&apos;écriture du logiciel
          Orcha, à des consommateurs comme à des professionnels. Passer commande vaut acceptation
          sans réserve.
        </p>
      </Section>

      <Section titre="Le produit">
        <p>
          Orcha est un logiciel qui s&apos;exécute sur la machine de l&apos;acheteur et lit son
          dossier <code>.claude</code>. <strong className="text-ink">La lecture est gratuite</strong>{" "}
          et le reste&nbsp;: inventaire, écarts, plans de workflow, veille.
        </p>
        <p>
          La licence vendue ouvre <strong className="text-ink">l&apos;écriture</strong> depuis
          l&apos;interface&nbsp;: modifier une compétence, ajouter ou retirer des étapes, créer et
          brancher des sous-agents.
        </p>
      </Section>

      <Section titre="Prix et paiement">
        <p>
          Le prix est de <strong className="text-ink">{montant ?? "— (tarif non configuré)"}</strong>,
          toutes taxes comprises, en euros. Il s&apos;agit d&apos;un{" "}
          <strong className="text-ink">achat unique</strong>&nbsp;: aucun abonnement, aucun
          prélèvement récurrent, mises à jour comprises sans limite de durée.
        </p>
        <p>
          Le paiement s&apos;effectue par carte via Stripe. Aucune donnée bancaire n&apos;est reçue
          ni conservée par l&apos;éditeur.
        </p>
      </Section>

      <Section titre="Livraison">
        <p>
          Le logiciel est <strong className="text-ink">libre et gratuit</strong>, publié sous
          licence MIT. Il s&apos;installe par <code>npx orcha-cli</code> sans achat ni compte, et
          son code est public.
        </p>
        <p>
          Ce qui s&apos;achète n&apos;est donc pas le logiciel mais{" "}
          <strong className="text-ink">le droit d&apos;écrire depuis son interface</strong>. Il
          s&apos;ouvre sur le compte au paiement, sans rien à installer ni à recopier&nbsp;: la
          page « Mon compte » en fait foi.
        </p>
      </Section>

      <Section titre="Droit de rétractation">
        <p>
          Le contenu numérique étant fourni immédiatement après le paiement, l&apos;acheteur
          consommateur <strong className="text-ink">renonce expressément</strong> à son droit de
          rétractation de quatorze jours, conformément à l&apos;article L221-28 13° du code de la
          consommation. Cette renonciation est recueillie lors de la commande.
        </p>
        <p>
          Un remboursement reste possible à la discrétion de l&apos;éditeur&nbsp;; il entraîne la
          fermeture du droit d&apos;écriture et le retrait de l&apos;accès au dépôt.
        </p>
      </Section>

      <Section titre="Garanties">
        <p>
          Les garanties légales de conformité et des vices cachés s&apos;appliquent. Orcha est
          fourni en l&apos;état&nbsp;: il rend visible ce qu&apos;un dossier <code>.claude</code>{" "}
          déclare et ce qui charge réellement, sans garantir l&apos;exhaustivité de ce diagnostic ni
          le comportement d&apos;outils tiers.
        </p>
      </Section>

      <Section titre="Litiges">
        <p>
          Le droit français s&apos;applique. Toute réclamation peut être adressée par courriel avant
          toute action contentieuse.
        </p>
        <ARemplir quoi="médiation de la consommation — obligatoire en vente aux particuliers">
          <p>
            Tout professionnel vendant à des consommateurs en France doit désigner un médiateur et
            en communiquer les coordonnées.
          </p>
          <div className="mt-2 space-y-2">
            <ChampARemplir intitule="Nom du médiateur de la consommation" />
            <ChampARemplir intitule="Adresse postale et site du médiateur" />
          </div>
        </ARemplir>
      </Section>
    </PageLegale>
  );
}
