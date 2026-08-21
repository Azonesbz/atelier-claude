import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLegale, Section } from "@/components/landing/PageLegale";
import { estPublic } from "@/lib/acces/role";

/* Le garde-fou doit s'évaluer à l'EXÉCUTION : prérendue, cette page
   figerait le rôle constaté à la construction, et apparaîtrait dans le paquet
   npm distribué aux utilisateurs. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Confidentialité — Orcha" };

/**
 * La politique de confidentialité.
 *
 * Elle décrit ce que le produit fait réellement, et c'est un argument autant
 * qu'une obligation : le dossier `.claude` de l'acheteur ne quitte jamais sa
 * machine, et ce site ne collecte rien du tout.
 */
export default function Confidentialite() {
  // Ces pages sont celles du site public : elles n'ont rien à faire chez
  // quelqu'un qui a lancé l'outil sur sa propre machine.
  if (!estPublic()) notFound();

  return (
    <PageLegale titre="Confidentialité" miseAJour="21 août 2026">
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
        <p>
          <strong className="text-ink">Aucune.</strong> Ce site présente un logiciel libre&nbsp;:
          il n&apos;a ni compte, ni formulaire, ni paiement, ni mesure d&apos;audience, ni traceur
          publicitaire. Rien n&apos;est collecté, donc rien n&apos;est conservé.
        </p>
        <p>
          Le logiciel, lui, s&apos;exécute chez toi et ne transmet rien à personne.
        </p>
      </Section>

      <Section titre="Hébergement">
        <p>
          Le site est servi par un serveur privé virtuel loué chez OVH SAS. Comme tout serveur
          web, il enregistre les requêtes reçues — dont l&apos;adresse IP — dans ses journaux
          techniques, le temps nécessaire à son exploitation et à sa sécurité.
        </p>
      </Section>

      <Section titre="Tes droits">
        <p>
          Il n&apos;y a pas de donnée à consulter, rectifier ou effacer. Pour toute question,
          écris à{" "}
          <a href="mailto:vincent.avez22@gmail.com" className="text-ink underline underline-offset-4">
            vincent.avez22@gmail.com
          </a>
          . Une réclamation peut être adressée à la CNIL.
        </p>
      </Section>

      <Section titre="Cookies">
        <p>
          <strong className="text-ink">Aucun cookie n&apos;est déposé</strong> par ce site.
        </p>
      </Section>
    </PageLegale>
  );
}
