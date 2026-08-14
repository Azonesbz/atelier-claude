/**
 * L'état du hook de veille, calculé plutôt que documenté.
 *
 * Le bloc à coller contenait un chemin absolu écrit à la main dans le README —
 * juste chez son auteur, faux chez tout le monde. L'application sait où elle a
 * été installée : elle produit donc le bloc exact, pour la machine où elle
 * tourne, et dit s'il est déjà en place.
 */

import { join } from "node:path";
import { lireJson, racineUtilisateur } from "./fichiers.ts";

const NOM_DU_HOOK = "hook.py";

export interface Veille {
  /** Le chemin absolu du hook sur cette machine. */
  chemin: string;
  /** Le bloc JSON à coller dans settings.json, prêt à l'emploi. */
  bloc: string;
  installe: boolean;
  /** Un hook SessionStart est déclaré, mais il ne pointe pas sur celui-ci. */
  autreHookPresent: boolean;
  fichierReglages: string;
}

export function lireVeille(): Veille {
  const chemin = join(process.cwd(), NOM_DU_HOOK);
  const fichierReglages = join(racineUtilisateur(), "settings.json");
  const commandes = commandesSessionStart(fichierReglages);

  return {
    chemin,
    bloc: blocAColler(chemin),
    installe: commandes.some((c) => c.includes(NOM_DU_HOOK)),
    autreHookPresent: commandes.length > 0 && !commandes.some((c) => c.includes(NOM_DU_HOOK)),
    fichierReglages,
  };
}

/** Les commandes déclarées sous SessionStart, tous groupes confondus. */
function commandesSessionStart(fichier: string): string[] {
  const hooks = lireJson(fichier).hooks;
  if (!hooks || typeof hooks !== "object") return [];

  const groupes = (hooks as Record<string, unknown>).SessionStart;
  if (!Array.isArray(groupes)) return [];

  return groupes.flatMap((groupe) => {
    const liste = (groupe as Record<string, unknown>)?.hooks;
    if (!Array.isArray(liste)) return [];
    return liste
      .map((h) => (h as Record<string, unknown>)?.command)
      .filter((c): c is string => typeof c === "string");
  });
}

function blocAColler(chemin: string): string {
  return JSON.stringify(
    {
      hooks: {
        SessionStart: [{ hooks: [{ type: "command", command: `python3 ${chemin}`, timeout: 10 }] }],
      },
    },
    null,
    2,
  );
}
