import { Cadre, Tete } from "./EcranCadre";
import { Entree, Pastille } from "@/components/primitives";
import type { Portee } from "@/lib/types";

/**
 * L'inventaire, avec la provenance de chaque ligne.
 *
 * La portée est ce que personne n'affiche : elle décide de la précédence, de ce
 * qui est modifiable, et de ce qui disparaîtra à la prochaine mise à jour d'un
 * plugin. C'est pourquoi la pastille de `primitives.tsx` est ici la même que
 * dans l'application, gloses au survol comprises.
 *
 * Rien de ce qui vient du plugin en panne n'apparaît dans cette liste : c'est
 * précisément le symptôme. Un plugin qui ne charge pas n'apporte rien.
 */
interface Ligne {
  nom: string;
  portee: Portee;
  origine: string;
  description: string;
  taille?: string;
}

const COMPETENCES: Ligne[] = [
  { nom: "grilling", portee: "utilisateur", origine: "~/.claude/skills", taille: "168 lignes",
    description: "Passer au gril un plan ou une décision : interroger jusqu'à épuisement des questions." },
  { nom: "idee", portee: "projet", origine: ".claude/skills", taille: "94 lignes",
    description: "Capturer une idée de micro-SaaS dans le vault, sous forme de fiche." },
  { nom: "ui-snapping", portee: "plugin", origine: "lp-builder", taille: "212 lignes",
    description: "Assembler une page à partir de composants existants plutôt que tout recoder." },
];

const AGENTS: Ligne[] = [
  { nom: "migrateur", portee: "utilisateur", origine: "~/.claude/agents",
    description: "Fait passer un schéma d'une version à la suivante, une migration à la fois." },
  { nom: "market-analyst", portee: "plugin", origine: "lp-builder",
    description: "Analyse concurrentielle d'une niche, puis blueprint de conversion." },
  { nom: "Explore", portee: "intégré", origine: "Claude Code",
    description: "Recherche en lecture seule : localise le code, ne le relit pas." },
];

export function EcranInventaire() {
  return (
    <Cadre chemin="~/.claude/skills · ~/.claude/agents" etiquette="inventaire — extrait">
      <Groupe titre="Compétences" compte={35} lignes={COMPETENCES} />
      <Groupe titre="Agents" compte={32} lignes={AGENTS} />
      <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
        Puis la suite du même inventaire : 30 commandes, 40 règles de permission, 6 hooks,
        4 plugins déclarés, 1 fichier d&apos;instructions — chacun avec sa portée.
      </p>
    </Cadre>
  );
}

function Groupe({ titre, compte, lignes }: { titre: string; compte: number; lignes: Ligne[] }) {
  return (
    <div className="mb-5">
      <Tete titre={titre} compte={compte} ton="text-ink" />
      <ul>
        {lignes.map((ligne) => (
          <Entree
            key={ligne.nom}
            description={ligne.description}
            titre={
              <>
                <span className="text-sm font-medium">{ligne.nom}</span>
                <Pastille portee={ligne.portee} origine={ligne.origine} />
                {ligne.taille && (
                  <span className="ml-auto font-mono text-[11px] tabular-nums text-muted">
                    {ligne.taille}
                  </span>
                )}
              </>
            }
          />
        ))}
      </ul>
    </div>
  );
}
