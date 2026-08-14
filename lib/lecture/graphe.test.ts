/**
 * Le graphe de références, sur un atelier fabriqué de toutes pièces.
 *
 * Ce qui compte ici n'est pas le nombre d'arêtes mais leur honnêteté : une
 * arête n'existe que si le nom cité correspond à un fichier réel.
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { construireGraphe } from "./graphe.ts";
import type { Atelier } from "../types.ts";

function atelierFabrique(cheminSkill: string, corps: string): Atelier {
  return {
    racineUtilisateur: "/racine",
    racineProjet: null,
    competences: [{
      nom: "pipeline", portee: "plugin", origine: "outil@marche", chemin: cheminSkill,
      description: "", invocableParLeModele: true, invocableParLUtilisateur: true,
      outilsAutorises: [], indiceArgument: "", corps, lignes: 10, silences: [],
    }],
    agents: [{
      nom: "verifier", portee: "plugin", origine: "outil@marche", chemin: "/racine/agents/verifier.md",
      description: "", outils: "", modele: "", corps: "", silences: [],
    }],
    commandes: [],
    hooks: [],
    permissions: [],
    plugins: [{
      identifiant: "outil@marche", marketplace: "marche", active: true,
      cheminInstallation: "/racine/cache", present: true, silences: [],
    }],
    instructions: [],
  };
}

const TABLEAU = [
  "| # | Étape | Rôle |",
  "|---|---|---|",
  "| 00 | `steps/step-00.md` | Départ |",
  "| 01 | `steps/step-01.md` | Suite |",
].join("\n");

test("le plugin contient ses compétences et ses agents", () => {
  // Arrange
  const racine = mkdtempSync(join(tmpdir(), "graphe-"));
  const atelier = atelierFabrique(join(racine, "SKILL.md"), "Rien de particulier.\n");

  // Act
  const graphe = construireGraphe(atelier);

  // Assert
  const contient = graphe.aretes.filter((a) => a.sorte === "contient");
  assert.equal(contient.length, 2, "une arête vers la compétence, une vers l'agent");
  assert.ok(contient.every((a) => a.source === "plugin:outil@marche"));
});

test("les étapes deviennent des nœuds reliés à leur compétence", () => {
  // Arrange
  const racine = mkdtempSync(join(tmpdir(), "graphe-"));
  mkdirSync(join(racine, "steps"));
  writeFileSync(join(racine, "steps", "step-00.md"), "Rien.\n", "utf8");
  writeFileSync(join(racine, "steps", "step-01.md"), "Délègue à `verifier`.\n", "utf8");
  const atelier = atelierFabrique(join(racine, "SKILL.md"), TABLEAU);

  // Act
  const graphe = construireGraphe(atelier);

  // Assert
  assert.equal(graphe.noeuds.filter((n) => n.sorte === "etape").length, 2);
  assert.equal(graphe.aretes.filter((a) => a.sorte === "sequence").length, 2);
  assert.equal(graphe.aretes.filter((a) => a.sorte === "delegue").length, 1);
});

test("un nom qui ne correspond à aucun fichier ne crée aucune arête", () => {
  // Arrange — `Explore` est un agent intégré, il n'a pas de fichier
  const racine = mkdtempSync(join(tmpdir(), "graphe-"));
  mkdirSync(join(racine, "steps"));
  writeFileSync(join(racine, "steps", "step-00.md"), "Délègue à `Explore`.\n", "utf8");
  writeFileSync(join(racine, "steps", "step-01.md"), "Rien.\n", "utf8");
  const atelier = atelierFabrique(join(racine, "SKILL.md"), TABLEAU);

  // Act
  const graphe = construireGraphe(atelier);

  // Assert
  assert.equal(graphe.aretes.filter((a) => a.sorte === "delegue").length, 0);
});

test("une étape dont le fichier manque est marquée en silence", () => {
  // Arrange — le tableau annonce deux étapes, aucune n'existe
  const racine = mkdtempSync(join(tmpdir(), "graphe-"));
  const atelier = atelierFabrique(join(racine, "SKILL.md"), TABLEAU);

  // Act
  const graphe = construireGraphe(atelier);

  // Assert
  const etapes = graphe.noeuds.filter((n) => n.sorte === "etape");
  assert.equal(etapes.length, 2);
  assert.ok(etapes.every((e) => e.enSilence));
});
