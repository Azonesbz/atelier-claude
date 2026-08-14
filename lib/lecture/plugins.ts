/**
 * Les plugins : la soustraction entre ce qui est déclaré et ce qui est là.
 *
 * Portage TypeScript de `ecart.py`, la règle du hook SessionStart. Même règle,
 * même interdit : ne JAMAIS passer par `claude plugin list`, qui repeuple
 * `installPath` depuis le clone de la marketplace avant d'afficher, et répare
 * donc ce qu'on cherche à mesurer. Vérifié le 14 août 2026 sur 2.1.227.
 */

import { join } from "node:path";
import type { Plugin, Silence } from "../types.ts";
import { contientUnFichier, lireJson } from "./fichiers.ts";

export function lirePlugins(racine: string): Plugin[] {
  const declares = fusionDeclarations(racine);
  const installations = lireJson(join(racine, "plugins", "installed_plugins.json")).plugins;
  const inscrits = (installations && typeof installations === "object" ? installations : {}) as Record<string, unknown>;

  return Object.entries(declares)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([identifiant, actif]) => depuisDeclaration(identifiant, actif === true, inscrits[identifiant]));
}

function fusionDeclarations(racine: string): Record<string, unknown> {
  const fusion: Record<string, unknown> = {};
  for (const fichier of ["settings.json", "settings.local.json"]) {
    const bloc = lireJson(join(racine, fichier)).enabledPlugins;
    if (bloc && typeof bloc === "object") Object.assign(fusion, bloc);
  }
  return fusion;
}

function depuisDeclaration(identifiant: string, actif: boolean, entrees: unknown): Plugin[] {
  const marketplace = identifiant.includes("@") ? identifiant.split("@").pop()! : "";
  const liste = Array.isArray(entrees) ? entrees : [];

  if (liste.length === 0) {
    return [{
      identifiant,
      marketplace,
      active: actif,
      cheminInstallation: "",
      present: false,
      silences: actif ? [sansInstallation()] : [],
    }];
  }

  return liste.map((entree) => {
    const chemin = String((entree as Record<string, unknown>)?.installPath ?? "");
    const present = contientUnFichier(chemin);
    return {
      identifiant,
      marketplace,
      active: actif,
      cheminInstallation: chemin,
      present,
      silences: actif && !present ? [chargeAbsente(chemin)] : [],
    };
  });
}

function sansInstallation(): Silence {
  return {
    cause: "déclaré actif, aucune installation enregistrée",
    detail: "Rien dans installed_plugins.json. Le plugin ne chargera pas, et aucun message ne le dira.",
  };
}

function chargeAbsente(chemin: string): Silence {
  return {
    cause: "répertoire d'installation absent ou vide",
    detail: `Déclaré installé en ${chemin || "(chemin vide)"}, mais rien n'y est. Le plugin ne chargera pas.`,
  };
}
