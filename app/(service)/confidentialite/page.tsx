import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLegale, Section } from "@/components/landing/PageLegale";
import { estService } from "@/lib/acces/role";

export const metadata: Metadata = { title: "Confidentialité — Orcha" };

/**
 * La politique de confidentialité.
 *
 * Elle décrit ce que le produit fait réellement, et c'est un argument autant
 * qu'une obligation : le dossier `.claude` de l'acheteur ne quitte jamais sa
 * machine, et le service ne sait qu'une chose — si un achat existe.
 */
export default function Confidentialite() {
  if (!estService()) notFound();

  return (
    <PageLegale titre="Confidentialité" miseAJour="19 août 2026">
      <Section titre="Ce qui ne quitte jamais ta machine">
        <p>
          Orcha s&apos;exécute localement et lit ton dossier <code>.claude</code> sur ton disque.{" "}
          <strong className="text-ink">
            Aucun contenu de ce dossier n&apos;est transmis à ce site, ni à qui que ce soit.
          </strong>{" "}
          Ni tes compétences, ni tes agents, ni tes réglages, ni tes secrets.
        </p>
        <p>
          La seule question que l&apos;application locale pose au service est&nbsp;: « ce compte
          a-t-il payé&nbsp;? ». La réponse est oui ou non.
        </p>
      </Section>

      <Section titre="Les données traitées ici">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink">Compte</strong> — adresse e-mail et identifiant, gérés par
            Clerk. Finalité&nbsp;: rattacher un achat à une personne.
          </li>
          <li>
            <strong className="text-ink">Paiement</strong> — géré par Stripe, qui conserve
            l&apos;historique de la transaction. Aucune donnée bancaire ne parvient à
            l&apos;éditeur.
          </li>
          <li>
            <strong className="text-ink">Identifiant GitHub</strong> — saisi au moment de
            l&apos;achat. Finalité&nbsp;: livrer l&apos;accès au dépôt privé.
          </li>
        </ul>
        <p>
          Base légale&nbsp;: l&apos;exécution du contrat de vente. Aucune donnée n&apos;est vendue,
          louée, ni utilisée à des fins publicitaires. Il n&apos;y a ni mesure d&apos;audience, ni
          traceur publicitaire sur ce site.
        </p>
      </Section>

      <Section titre="Sous-traitants">
        <p>
          Clerk (authentification), Stripe (paiement), GitHub (livraison) et OVH (hébergement).
          Chacun applique sa propre politique, consultable sur son site.
        </p>
      </Section>

      <Section titre="Durée et droits">
        <p>
          Les données liées à un achat sont conservées le temps de la relation commerciale et des
          obligations comptables qui s&apos;y attachent.
        </p>
        <p>
          Tu disposes d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          portabilité et d&apos;opposition. Écris à{" "}
          <a href="mailto:vincent.avez22@gmail.com" className="text-ink underline underline-offset-4">
            vincent.avez22@gmail.com
          </a>
          . Une réclamation peut être adressée à la CNIL.
        </p>
      </Section>

      <Section titre="Cookies">
        <p>
          Seuls des cookies strictement nécessaires sont déposés, par Clerk, pour maintenir une
          session ouverte. Ils ne servent ni au suivi, ni à la publicité, et ne demandent donc pas
          de consentement préalable.
        </p>
      </Section>
    </PageLegale>
  );
}
