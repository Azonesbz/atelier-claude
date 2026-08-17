import { Cadre, Tete } from "./EcranCadre";
import { Entree, Pastille } from "@/components/primitives";
import type { Portee } from "@/lib/types";

/**
 * Les écarts, et la règle qui les a trouvés.
 *
 * Un outil qui annonce une panne inexistante est pire que pas d'outil : c'est
 * pourquoi aucun verdict n'est rendu sans sa raison. La règle est affichée à
 * côté du constat, exactement comme dans l'application — le composant
 * `Silences` de `primitives.tsx` est repris tel quel, pas imité.
 *
 * Ces trois écarts sont la même machine que celle du héros, et ce n'est pas un
 * hasard : deux inventaires qui ne racontent pas la même histoire décrédibilisent
 * les deux. Le premier est le cas réel qui a fait naître le produit.
 */
export interface Ecart {
  nom: string;
  portee: Portee;
  origine: string;
  /** Le nom de la règle de détection, tel qu'il s'affiche dans l'application. */
  regle: string;
  detail: string;
}

export const ECARTS: Ecart[] = [
  {
    nom: "dev-methodology@claude-config",
    portee: "plugin",
    origine: "claude-config",
    regle: "plugin déclaré, cache absent",
    detail:
      "Inscrit dans enabledPlugins, mais ~/.claude/plugins/cache/claude-config n'existe pas sur le disque. Ses 16 compétences ne chargent pas.",
  },
  {
    nom: "relecteur",
    portee: "utilisateur",
    origine: "~/.claude/agents",
    regle: "agent sans description",
    detail:
      "Claude choisit un agent d'après sa description, et d'après elle seule. Sans description, il ne sera jamais appelé.",
  },
  {
    nom: "lancer · étape 4",
    portee: "utilisateur",
    origine: "~/.claude/skills",
    regle: "étape déclarée, fichier absent",
    detail:
      "etapes/mise-en-ligne.md est nommé dans le SKILL.md ; le fichier n'est pas là. L'étape ne s'exécutera jamais.",
  },
];

export function EcranEcarts() {
  return (
    <Cadre chemin="~/.claude" etiquette="écarts">
      <Tete titre="Sans effet" compte={ECARTS.length} ton="text-danger" />
      <ul>
        {ECARTS.map((ecart) => (
          <Entree
            key={ecart.nom}
            silences={[{ cause: ecart.regle, detail: ecart.detail }]}
            titre={
              <>
                <span className="font-mono text-sm font-medium">{ecart.nom}</span>
                <Pastille portee={ecart.portee} origine={ecart.origine} />
              </>
            }
          />
        ))}
      </ul>
    </Cadre>
  );
}
