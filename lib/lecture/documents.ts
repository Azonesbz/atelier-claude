/**
 * Les agents et les commandes : un fichier Markdown, un frontmatter, un nom.
 *
 * Les deux se ressemblent tellement sur le disque qu'on les confond, mais ils
 * ne se déclenchent pas pareil : un agent est choisi par le modèle d'après sa
 * description, une commande est tapée par l'utilisateur. Le nom d'invocation
 * vient du nom de fichier, pas du champ `name` — c'est la source d'erreur.
 */

import { basename, join } from "node:path";
import type { Agent, Commande, Portee, Silence } from "../types.ts";
import { decouper, estDossier, listerFichiers, lireTexte } from "./fichiers.ts";

export function lireAgents(racine: string, portee: Portee, origine: string): Agent[] {
  return lireDossier(racine, "agents", portee, origine).map(({ nom, entete, corps, chemin, silences }) => ({
    nom,
    portee,
    origine,
    chemin,
    description: texte(entete.description),
    outils: texte(entete.tools) || "hérités de la session",
    modele: texte(entete.model) || "celui de la session",
    corps,
    silences: [...silences, ...sansDescription(entete, "Sans description, le modèle ne saura jamais quand déléguer à cet agent.")],
  }));
}

export function lireCommandes(racine: string, portee: Portee, origine: string): Commande[] {
  return lireDossier(racine, "commands", portee, origine).map(({ nom, entete, corps, chemin, silences }) => ({
    nom,
    portee,
    origine,
    chemin,
    description: texte(entete.description),
    indiceArgument: texte(entete["argument-hint"]),
    corps,
    silences,
  }));
}

interface Brut {
  nom: string;
  entete: Record<string, unknown>;
  corps: string;
  chemin: string;
  silences: Silence[];
}

function lireDossier(racine: string, sous: string, _portee: Portee, _origine: string): Brut[] {
  const dossier = join(racine, sous);
  if (!estDossier(dossier)) return [];

  return listerFichiers(dossier, ".md").map((fichier) => {
    const chemin = join(dossier, fichier);
    const brut = lireTexte(chemin) ?? "";
    const { entete, corps, enteteValide } = decouper(brut);
    const nomFichier = basename(fichier, ".md");
    const silences: Silence[] = [];

    if (!enteteValide) {
      silences.push({
        cause: "frontmatter absent ou illisible",
        detail: "Le fichier est là, mais rien ne permet de le présenter ni de le déclencher.",
      });
    }
    const declare = texte(entete.name);
    if (declare && declare !== nomFichier) {
      silences.push({
        cause: "nom différent du fichier",
        detail: `Le champ name vaut « ${declare} », l'invocation se fait sur « ${nomFichier} ».`,
      });
    }
    return { nom: nomFichier, entete, corps, chemin, silences };
  });
}

function sansDescription(entete: Record<string, unknown>, detail: string): Silence[] {
  return texte(entete.description) ? [] : [{ cause: "aucune description", detail }];
}

function texte(valeur: unknown): string {
  return typeof valeur === "string" ? valeur.trim() : "";
}
