import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARemplir, ChampARemplir } from "@/components/landing/ARemplir";
import { PageLegale, Section } from "@/components/landing/PageLegale";
import { estService } from "@/lib/acces/role";

export const metadata: Metadata = { title: "Mentions légales — Orcha" };

/**
 * Les mentions légales, exigées par la LCEN pour tout site accessible au
 * public — et davantage encore dès lors qu'on y vend.
 *
 * L'identité de l'éditeur ne se devine pas : statut, numéro d'immatriculation
 * et adresse professionnelle sont des faits juridiques. Ils restent en
 * emplacement signalé plutôt qu'inventés, parce qu'une mention fausse expose
 * plus qu'une mention absente.
 */
export default function Mentions() {
  if (!estService()) notFound();

  return (
    <PageLegale titre="Mentions légales" miseAJour="19 août 2026">
      <Section titre="Éditeur du site">
        <p>
          Le site <strong className="text-ink">orcha.vincentavz.com</strong> et le logiciel Orcha
          sont édités par Vincent Avez.
        </p>
        <p>
          Contact&nbsp;:{" "}
          <a href="mailto:vincent.avez22@gmail.com" className="text-ink underline underline-offset-4">
            vincent.avez22@gmail.com
          </a>
        </p>
        <ARemplir quoi="identité juridique de l'éditeur">
          <p>
            Ces informations sont exigées par la loi dès lors qu&apos;un site vend à des
            particuliers. Elles ne peuvent pas être devinées.
          </p>
          <div className="mt-2 space-y-2">
            <ChampARemplir intitule="Statut — entrepreneur individuel, micro-entreprise, SASU…" />
            <ChampARemplir intitule="Numéro SIREN ou SIRET" />
            <ChampARemplir intitule="Adresse professionnelle" />
            <ChampARemplir intitule="Numéro de TVA intracommunautaire, si assujetti" />
            <ChampARemplir intitule="Directeur de la publication, si différent de l'éditeur" />
          </div>
        </ARemplir>
      </Section>

      <Section titre="Hébergement">
        <p>
          Le site est hébergé sur un serveur privé virtuel fourni par <strong className="text-ink">OVH
          SAS</strong>, 2 rue Kellermann, 59100 Roubaix, France —{" "}
          <a href="https://www.ovhcloud.com" className="underline underline-offset-4">
            ovhcloud.com
          </a>
          .
        </p>
      </Section>

      <Section titre="Prestataires techniques">
        <p>
          L&apos;authentification des comptes est assurée par <strong className="text-ink">Clerk</strong>,
          et les paiements par <strong className="text-ink">Stripe</strong>. Aucune donnée bancaire
          ne transite par ce site&nbsp;: le formulaire de paiement est hébergé par Stripe.
        </p>
        <p>
          La livraison du logiciel passe par une invitation au dépôt privé hébergé chez{" "}
          <strong className="text-ink">GitHub</strong>.
        </p>
      </Section>

      <Section titre="Propriété intellectuelle">
        <p>
          Le code source d&apos;Orcha, sa documentation et le contenu de ce site sont la propriété
          de leur auteur. L&apos;achat d&apos;une licence confère un droit d&apos;usage personnel,
          il n&apos;emporte aucune cession de droits.
        </p>
      </Section>
    </PageLegale>
  );
}
