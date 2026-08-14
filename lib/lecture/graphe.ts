/**
 * Le réseau du dossier : qui cite qui.
 *
 * Ce n'est pas un graphe d'exécution — Claude Code n'exécute pas de graphe, et
 * prétendre le contraire serait mentir. C'est un graphe de **références** : une
 * arête existe quand un fichier en nomme un autre, et que ce nom correspond à
 * quelque chose de réellement présent sur le disque.
 *
 * Un nom qui ne résout rien ne produit aucune arête : les agents intégrés
 * (`Explore`, `Plan`…) n'ont pas de fichier, les signaler comme cassés serait
 * un faux positif de plus.
 */

import type { Atelier, Portee } from "../types.ts";
import { lireTexte } from "./fichiers.ts";
import { lireWorkflow, referencesDans } from "./workflow.ts";

export type SorteNoeud = "competence" | "agent" | "commande" | "etape" | "plugin";

/** Comment une arête a été établie. Détermine sa couleur et son épaisseur. */
export type SorteArete = "contient" | "sequence" | "delegue" | "cite";

export interface Noeud {
  id: string;
  etiquette: string;
  sorte: SorteNoeud;
  portee: Portee;
  origine: string;
  chemin: string;
  poids: number;
  enSilence: boolean;
  lien: string | null;
}

export interface Arete {
  source: string;
  cible: string;
  sorte: SorteArete;
}

export interface Graphe {
  noeuds: Noeud[];
  aretes: Arete[];
}

export function construireGraphe(atelier: Atelier): Graphe {
  const noeuds = new Map<string, Noeud>();
  const aretes: Arete[] = [];
  const ajouter = (noeud: Noeud) => {
    if (!noeuds.has(noeud.id)) noeuds.set(noeud.id, noeud);
  };
  const relier = (source: string, cible: string, sorte: SorteArete) => {
    if (source !== cible) aretes.push({ source, cible, sorte });
  };

  const parNom = indexerParNom(atelier);

  for (const plugin of atelier.plugins) {
    ajouter({
      id: `plugin:${plugin.identifiant}`,
      etiquette: plugin.identifiant,
      sorte: "plugin",
      portee: "plugin",
      origine: plugin.marketplace,
      chemin: plugin.cheminInstallation,
      poids: 40,
      enSilence: plugin.silences.length > 0,
      lien: null,
    });
  }

  for (const competence of atelier.competences) {
    ajouter(depuisDocument("competence", competence, `/competence/${encodeURIComponent(competence.chemin)}`));
    relierAuPlugin(competence.origine, `competence:${competence.chemin}`, noeuds, relier);
  }
  for (const agent of atelier.agents) {
    ajouter(depuisDocument("agent", { ...agent, lignes: 20 }, null));
    relierAuPlugin(agent.origine, `agent:${agent.chemin}`, noeuds, relier);
  }
  for (const commande of atelier.commandes) {
    ajouter(depuisDocument("commande", { ...commande, lignes: 20 }, null));
    relierAuPlugin(commande.origine, `commande:${commande.chemin}`, noeuds, relier);
  }

  for (const competence of atelier.competences) {
    const source = `competence:${competence.chemin}`;
    const workflow = lireWorkflow(competence.chemin, competence.corps, {
      agents: [...parNom.agents.keys()],
      competences: [...parNom.competences.keys()],
    });

    if (workflow) {
      for (const etape of workflow.etapes) {
        const idEtape = `etape:${etape.cheminAbsolu}`;
        ajouter({
          id: idEtape,
          etiquette: `${etape.numero} · ${etape.role.slice(0, 28)}`,
          sorte: "etape",
          portee: competence.portee,
          origine: competence.nom,
          chemin: etape.cheminAbsolu,
          poids: etape.lignes,
          enSilence: !etape.present,
          lien: null,
        });
        relier(source, idEtape, "sequence");
        for (const nom of etape.agents) relierVers(parNom.agents, nom, idEtape, "delegue", relier);
        for (const nom of etape.competences) relierVers(parNom.competences, nom, idEtape, "delegue", relier);
      }
      continue;
    }

    for (const nom of referencesDans(competence.corps, [...parNom.agents.keys()])) {
      relierVers(parNom.agents, nom, source, "cite", relier);
    }
    for (const nom of referencesDans(competence.corps, [...parNom.competences.keys()])) {
      relierVers(parNom.competences, nom, source, "cite", relier);
    }
  }

  for (const agent of atelier.agents) {
    const contenu = lireTexte(agent.chemin);
    for (const nom of referencesDans(contenu, [...parNom.competences.keys()])) {
      relierVers(parNom.competences, nom, `agent:${agent.chemin}`, "cite", relier);
    }
  }

  return { noeuds: [...noeuds.values()], aretes: dedoublonner(aretes) };
}

interface DocumentLu {
  nom: string;
  portee: Portee;
  origine: string;
  chemin: string;
  lignes: number;
  silences: unknown[];
}

function depuisDocument(sorte: SorteNoeud, doc: DocumentLu, lien: string | null): Noeud {
  return {
    id: `${sorte}:${doc.chemin}`,
    etiquette: doc.nom,
    sorte,
    portee: doc.portee,
    origine: doc.origine,
    chemin: doc.chemin,
    poids: doc.lignes,
    enSilence: doc.silences.length > 0,
    lien,
  };
}

function indexerParNom(atelier: Atelier) {
  return {
    agents: new Map(atelier.agents.map((a) => [a.nom, `agent:${a.chemin}`])),
    competences: new Map(atelier.competences.map((c) => [c.nom, `competence:${c.chemin}`])),
  };
}

function relierVers(
  index: Map<string, string>,
  nom: string,
  source: string,
  sorte: SorteArete,
  relier: (s: string, c: string, t: SorteArete) => void,
) {
  const cible = index.get(nom);
  if (cible) relier(source, cible, sorte);
}

/** Rattache un élément au nœud de son plugin, quand son origine en nomme un. */
function relierAuPlugin(
  origine: string,
  id: string,
  noeuds: Map<string, Noeud>,
  relier: (s: string, c: string, t: SorteArete) => void,
) {
  if (!origine.includes("@")) return;
  const idPlugin = `plugin:${origine}`;
  if (noeuds.has(idPlugin)) relier(idPlugin, id, "contient");
}

function dedoublonner(aretes: Arete[]): Arete[] {
  const vues = new Set<string>();
  return aretes.filter((a) => {
    const cle = `${a.source}→${a.cible}`;
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
}
