/**
 * La lecture complète : les deux portées, plus les plugins actifs.
 *
 * L'ordre compte. Ce qui vient du projet passe avant ce qui vient de
 * l'utilisateur, et les plugins arrivent en dernier parce que leur contenu
 * n'appartient à personne sur cette machine — on le regarde, on n'y touche pas.
 */

import { join } from "node:path";
import type { Atelier, FichierInstructions, Portee } from "../types.ts";
import { lireCompetences } from "./competences.ts";
import { lireAgents, lireCommandes } from "./documents.ts";
import { estDossier, listerDossiers, lireTexte, racineProjet, racineUtilisateur } from "./fichiers.ts";
import { lirePlugins } from "./plugins.ts";
import { lireHooks, lirePermissions } from "./reglages.ts";

export function lireAtelier(): Atelier {
  const utilisateur = racineUtilisateur();
  const projet = racineProjet();

  const sources: Array<[string, Portee, string]> = [
    [utilisateur, "utilisateur", "~/.claude"],
    ...(projet ? ([[projet, "projet", cheminCourt(projet)]] as Array<[string, Portee, string]>) : []),
    ...racinesDePlugins(utilisateur),
  ];

  return {
    racineUtilisateur: utilisateur,
    racineProjet: projet,
    competences: sources.flatMap(([r, p, o]) => lireCompetences(r, p, o)),
    agents: sources.flatMap(([r, p, o]) => lireAgents(r, p, o)),
    commandes: sources.flatMap(([r, p, o]) => lireCommandes(r, p, o)),
    hooks: [
      ...lireHooks(utilisateur, "utilisateur"),
      ...(projet ? lireHooks(projet, "projet") : []),
    ],
    permissions: [
      ...lirePermissions(utilisateur, "utilisateur"),
      ...(projet ? lirePermissions(projet, "projet") : []),
    ],
    plugins: lirePlugins(utilisateur),
    instructions: lireInstructions(utilisateur, projet),
  };
}

/** Les plugins réellement présents sur le disque, vus depuis leur clone. */
function racinesDePlugins(utilisateur: string): Array<[string, Portee, string]> {
  const marketplaces = join(utilisateur, "plugins", "marketplaces");
  if (!estDossier(marketplaces)) return [];

  const trouves: Array<[string, Portee, string]> = [];
  for (const marche of listerDossiers(marketplaces)) {
    const dossier = join(marketplaces, marche, "plugins");
    for (const plugin of listerDossiers(dossier)) {
      trouves.push([join(dossier, plugin), "plugin", `${plugin}@${marche}`]);
    }
  }
  return trouves;
}

function lireInstructions(utilisateur: string, projet: string | null): FichierInstructions[] {
  const candidats: Array<[string, Portee]> = [
    [join(utilisateur, "CLAUDE.md"), "utilisateur"],
    ...(projet ? ([[join(projet, "..", "CLAUDE.md"), "projet"]] as Array<[string, Portee]>) : []),
  ];

  return candidats.flatMap(([chemin, portee]) => {
    const contenu = lireTexte(chemin);
    if (contenu === null) return [];
    return [{
      chemin,
      portee,
      octets: Buffer.byteLength(contenu, "utf8"),
      lignes: contenu.split("\n").length,
    }];
  });
}

function cheminCourt(chemin: string): string {
  const morceaux = chemin.split("/");
  return morceaux.slice(-2).join("/");
}
