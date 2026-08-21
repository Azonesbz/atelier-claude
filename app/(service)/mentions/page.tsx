import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLegale, Section } from "@/components/landing/PageLegale";
import { estPublic } from "@/lib/acces/role";

/* Le garde-fou doit s'évaluer à l'EXÉCUTION : prérendue, cette page
   figerait le rôle constaté à la construction, et apparaîtrait dans le paquet
   npm distribué aux utilisateurs. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mentions légales — Orcha" };

/**
 * Les mentions légales, exigées par la LCEN pour tout site accessible au
 * public — et davantage encore dès lors qu'on y vend.
 *
 * Le site ne vend plus rien, ce qui change la nature de l'obligation : un
 * éditeur non professionnel peut s'en tenir aux coordonnées de son hébergeur,
 * dès lors qu'il lui a communiqué son identité (LCEN, article 6 III 2). Le
 * SIREN et l'adresse professionnelle qu'exigeait la vente n'ont plus d'objet.
 *
 * Ce n'est pas un avis juridique : à faire relire si un doute subsiste.
 */
export default function Mentions() {
  // Ces pages sont celles du site public : elles n'ont rien à faire chez
  // quelqu'un qui a lancé l'outil sur sa propre machine.
  if (!estPublic()) notFound();

  return (
    <PageLegale titre="Mentions légales" miseAJour="21 août 2026">
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
        <p>
          Ce site est édité à titre <strong className="text-ink">non professionnel</strong>&nbsp;:
          il ne vend rien, le logiciel qu&apos;il présente est libre et gratuit, et son code est
          public. L&apos;éditeur se prévaut à ce titre de l&apos;anonymat prévu par
          l&apos;article&nbsp;6&nbsp;III&nbsp;2 de la LCEN, ayant communiqué son identité à
          l&apos;hébergeur, qui la tient à la disposition de l&apos;autorité judiciaire.
        </p>
        <p>
          Directeur de la publication&nbsp;: Vincent Avez.
        </p>
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

      <Section titre="Propriété intellectuelle">
        <p>
          Le code source d&apos;Orcha, sa documentation et le contenu de ce site sont la propriété
          de leur auteur. Le code est publié sous licence MIT&nbsp;: chacun peut l&apos;utiliser, le modifier et le
          redistribuer, à condition d&apos;en conserver la mention de licence.
        </p>
      </Section>
    </PageLegale>
  );
}
