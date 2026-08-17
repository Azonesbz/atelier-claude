import { AppelPrincipal } from "./Appel";
import { EcranEcarts } from "./EcranEcarts";
import { EcranInventaire } from "./EcranInventaire";
import { EcranPlan } from "./EcranPlan";
import { EcranVeille } from "./EcranVeille";

/**
 * La démonstration : quatre tâches, quatre écrans.
 *
 * Le produit n'a ni démo hébergée ni acheteur à citer. Ce qui reste pour lever
 * le « est-ce que ça marche vraiment » est de montrer le travail fait, une
 * tâche à la fois, dans l'interface elle-même. C'est le seul endroit de la page
 * où l'on demande de la lecture longue, et c'est justifié : c'est là que se
 * décide l'achat.
 *
 * D'où l'appel qui la referme, et nulle part avant. Un bouton posé plus haut
 * arrive sur un doute encore ouvert.
 */
export function Demonstration({ montant }: { montant: string | null }) {
  return (
    <section id="demonstration" className="mt-20 scroll-mt-4 sm:mt-28">
      <Bloc
        titre="Tout ce qui est déclaré, avec sa provenance."
        corps={
          <>
            35 compétences, 32 agents, 30 commandes, 40 règles de permission, les hooks, les
            plugins, les fichiers d&apos;instructions. Chaque ligne porte sa portée : ce qui vient
            de ton dossier personnel, du <code>.claude</code> du projet, d&apos;un plugin, ou de
            Claude Code lui-même.
          </>
        }
      >
        <EcranInventaire />
      </Bloc>

      <Bloc
        titre="Et ce qui est là sans rien faire."
        corps="Chaque écart affiche la règle qui l'a détecté. Pas de verdict sans sa raison — un outil qui annonce une panne inexistante est pire que pas d'outil."
      >
        <EcranEcarts />
      </Bloc>

      <Bloc
        titre="Les étapes d'une compétence, dans leur ordre réel."
        corps={
          <>
            Le point de départ suit la déclaration du <code>SKILL.md</code>, pas l&apos;ordre des
            fichiers. Une transition que l&apos;étape ne confirme pas est marquée comme telle. Une
            étape dont le fichier manque ne s&apos;exécutera jamais : elle apparaît.
          </>
        }
      >
        <EcranPlan />
      </Bloc>

      <Bloc
        titre="Un hook qui se tait quand tout va bien."
        corps={
          <>
            {/* 183 et non 362 : `wc -l` sur les six .py du dépôt compte les tests.
                Et pas de « 29 ms » : aucune mesure reproductible ne l'étaye. */}
            183 lignes, aucune dépendance — la bibliothèque standard suffit. Il lit{" "}
            <code>enabledPlugins</code>,
            vérifie sur disque que chaque <code>installPath</code> existe, et n&apos;ouvre la bouche
            qu&apos;en cas d&apos;écart. Il vit{" "}
            <strong className="font-semibold text-ink">hors de tout plugin</strong> : un plugin mort
            ne charge pas ses propres hooks, donc ne peut pas signaler sa mort.
          </>
        }
      >
        <EcranVeille />
      </Bloc>

      <div className="mt-12 border-t border-line pt-8">
        <AppelPrincipal montant={montant} />
      </div>
    </section>
  );
}

function Bloc({
  titre,
  corps,
  children,
}: {
  titre: string;
  corps: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="mt-14 first:mt-0">
      <h2 className="text-xl font-semibold text-balance sm:text-2xl">{titre}</h2>
      <p className="mt-3 max-w-2xl text-base text-ink-soft">{corps}</p>
      <div className="mt-6">{children}</div>
    </article>
  );
}
