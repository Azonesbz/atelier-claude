/**
 * Créer un sous-agent, et le brancher sur une étape.
 *
 * Deux gestes distincts, parce qu'ils échouent différemment : créer écrit un
 * fichier neuf dans `agents/`, brancher modifie un fichier d'étape existant.
 *
 * Brancher n'insère jamais de texte au milieu de la prose de quelqu'un. Une
 * section `## Sous-agents` est créée en fin de fichier au besoin, et c'est la
 * seule que cet outil touche.
 */

import { join } from "node:path";
import { lireTexte } from "../lecture/fichiers.ts";
import {
  cheminModifiable,
  doitEtreLibre,
  EcritureRefusee,
  ecrireAtomiquement,
  nomValide,
  racineDe,
  type Portee,
} from "./garde.ts";

export interface NouvelAgent {
  nom: string;
  description: string;
  outils: string;
  modele: string;
}

/** Écrit `agents/<nom>.md` dans la portée demandée. Rend le chemin écrit. */
export function creerAgent(portee: Portee, agent: NouvelAgent): string {
  const nom = nomValide(agent.nom);
  const description = agent.description.trim();
  if (!description) {
    throw new EcritureRefusee(
      "Un agent sans description n'est jamais choisi : c'est elle que le modèle lit " +
        "pour décider de déléguer.",
    );
  }

  const chemin = join(racineDe(portee), "agents", `${nom}.md`);
  cheminModifiable(chemin);
  doitEtreLibre(chemin);

  ecrireAtomiquement(chemin, fichierAgent(nom, description, agent.outils, agent.modele));
  return chemin;
}

function fichierAgent(nom: string, description: string, outils: string, modele: string): string {
  const entete = [`name: ${nom}`, `description: ${description}`];
  if (outils.trim()) entete.push(`tools: ${outils.trim()}`);
  if (modele.trim()) entete.push(`model: ${modele.trim()}`);

  return ["---", ...entete, "---", "", "**Déclencher quand** : à écrire.", "", "## Ce que tu fais", "", "À écrire.", ""].join("\n");
}

const TITRE_SECTION = "## Sous-agents";

export type Branchement = "ajoute" | "deja-present";

/**
 * Ajoute un agent à la section `## Sous-agents` d'une étape.
 *
 * Si l'agent est déjà nommé ailleurs dans le fichier, on ne touche à rien : il
 * est déjà branché, et l'ajouter une seconde fois embrouillerait la lecture
 * sans rien changer au comportement.
 */
export function brancherAgent(cheminEtape: string, nomAgent: string): Branchement {
  const absolu = cheminModifiable(cheminEtape);
  const nom = nomValide(nomAgent);

  const contenu = lireTexte(absolu);
  if (contenu === null) throw new EcritureRefusee("Ce fichier d'étape est introuvable.");
  if (contenu.includes(`\`${nom}\``)) return "deja-present";

  ecrireAtomiquement(absolu, avecAgent(contenu, nom));
  return "ajoute";
}

function avecAgent(contenu: string, nom: string): string {
  const ligne = `- \`${nom}\``;
  const index = contenu.indexOf(TITRE_SECTION);

  if (index === -1) {
    const separateur = contenu.endsWith("\n") ? "\n" : "\n\n";
    return `${contenu}${separateur}${TITRE_SECTION}\n\n${ligne}\n`;
  }

  const lignes = contenu.split("\n");
  const debut = lignes.findIndex((l) => l.startsWith(TITRE_SECTION));
  let fin = debut + 1;
  while (fin < lignes.length && !lignes[fin].startsWith("## ")) fin++;

  const derniereEntree = derniereListe(lignes, debut + 1, fin);
  lignes.splice(derniereEntree + 1, 0, ligne);
  return lignes.join("\n");
}

/** L'index de la dernière puce de la section, ou du titre s'il n'y en a aucune. */
function derniereListe(lignes: string[], debut: number, fin: number): number {
  let dernier = debut;
  for (let i = debut; i < fin; i++) {
    if (lignes[i].startsWith("- ")) dernier = i;
  }
  return dernier;
}
