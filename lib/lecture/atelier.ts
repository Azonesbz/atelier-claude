/**
 * La lecture complète : les deux portées, plus les plugins actifs.
 *
 * L'ordre compte. Ce qui vient du projet passe avant ce qui vient de
 * l'utilisateur, et les plugins arrivent en dernier parce que leur contenu
 * n'appartient à personne sur cette machine — on le regarde, on n'y touche pas.
 */

import { join } from "node:path";
import type { Atelier, FichierInstructions, Plugin, PluginAuCatalogue, Portee } from "../types.ts";
import { lireCompetences } from "./competences.ts";
import { lireAgents, lireCommandes } from "./documents.ts";
import { estDossier, listerDossiers, lireTexte, racineProjet, racineUtilisateur } from "./fichiers.ts";
import { lirePlugins } from "./plugins.ts";
import { lireHooks, lirePermissions } from "./reglages.ts";

export function lireAtelier(): Atelier {
  const utilisateur = racineUtilisateur();
  const projet = racineProjet();

  const plugins = lirePlugins(utilisateur);
  const sources: Array<[string, Portee, string]> = [
    [utilisateur, "utilisateur", "~/.claude"],
    ...(projet ? ([[projet, "projet", cheminCourt(projet)]] as Array<[string, Portee, string]>) : []),
    ...racinesDePluginsActifs(plugins),
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
    plugins,
    catalogue: lireCatalogue(utilisateur, plugins),
    instructions: lireInstructions(utilisateur, projet),
  };
}

/**
 * Les plugins qui chargent réellement — activés ET présents sur le disque.
 *
 * ATTENTION — faute corrigée le 15 août 2026. Une première version balayait
 * tous les clones de marketplaces, donc tout le CATALOGUE. Sur cette machine,
 * ça faisait entrer 152 compétences, agents et commandes de
 * `claude-plugins-official` dans les listes, présentés comme chargés, alors
 * qu'aucun de ces plugins n'est activé. L'outil commettait très exactement
 * l'écart qu'il existe pour dénoncer : afficher du déclaré comme du chargé.
 *
 * On part donc de `enabledPlugins` croisé avec le disque, et on lit le
 * répertoire d'installation — pas le clone de marketplace, qui diverge dès
 * qu'une marketplace avance sans `claude plugin update`.
 */
function racinesDePluginsActifs(plugins: Plugin[]): Array<[string, Portee, string]> {
  return plugins
    .filter((p) => p.active && p.present)
    .map((p) => [p.cheminInstallation, "plugin", p.identifiant] as [string, Portee, string]);
}

/**
 * Ce que les marketplaces proposent sans que ce soit activé.
 *
 * Rien de tout ça ne charge. C'est pourtant une information qu'aucune commande
 * intégrée ne donne : elle sort des listes principales, elle ne disparaît pas.
 */
function lireCatalogue(utilisateur: string, actifs: Plugin[]): PluginAuCatalogue[] {
  const marketplaces = join(utilisateur, "plugins", "marketplaces");
  if (!estDossier(marketplaces)) return [];

  const dejaActifs = new Set(actifs.filter((p) => p.active).map((p) => p.identifiant));
  const trouves: PluginAuCatalogue[] = [];

  for (const marche of listerDossiers(marketplaces)) {
    const dossier = join(marketplaces, marche, "plugins");
    for (const nom of listerDossiers(dossier)) {
      const identifiant = `${nom}@${marche}`;
      if (dejaActifs.has(identifiant)) continue;
      const racine = join(dossier, nom);
      trouves.push({
        identifiant,
        marketplace: marche,
        competences: lireCompetences(racine, "plugin", identifiant).length,
        agents: lireAgents(racine, "plugin", identifiant).length,
        commandes: lireCommandes(racine, "plugin", identifiant).length,
      });
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
