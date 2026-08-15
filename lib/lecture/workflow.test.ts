/**
 * L'extraction des étapes, sur un dossier jetable.
 *
 * Le tableau de `halo` sert de gabarit : c'est la forme réelle qu'on doit lire,
 * y compris ses cellules en gras et ses flèches.
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { lireWorkflow } from "./workflow.ts";

const RESOLVEUR = { agents: ["test-builder", "verifier"], competences: ["grilling"] };

function atelierJetable(): string {
  const racine = mkdtempSync(join(tmpdir(), "workflow-"));
  mkdirSync(join(racine, "steps"), { recursive: true });
  return racine;
}

const TABLEAU = [
  "## Séquence",
  "",
  "| # | Étape | Rôle |",
  "|---|---|---|",
  "| 00 | `steps/step-00-init.md` | Reconnaissance |",
  "| 01 | `steps/step-01-analyze.md` | Analyse d'impact |",
  "| 02 | `steps/step-02-plan.md` | Plan → **arrêt dur `ok`** |",
  "",
].join("\n");

test("les étapes sont lues dans l'ordre du tableau, avec leur rôle", () => {
  // Arrange
  const racine = atelierJetable();
  for (const nom of ["step-00-init", "step-01-analyze", "step-02-plan"]) {
    writeFileSync(join(racine, "steps", `${nom}.md`), "Contenu.\n", "utf8");
  }

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), TABLEAU, RESOLVEUR);

  // Assert
  assert.ok(workflow);
  assert.deepEqual(workflow.etapes.map((e) => e.numero), ["00", "01", "02"]);
  assert.equal(workflow.etapes[1].role, "Analyse d'impact");
  assert.equal(workflow.etapes[2].arretDur, true, "« arrêt dur » doit être repéré");
  assert.equal(workflow.etapes[0].arretDur, false);
});

test("une étape déclarée dont le fichier manque est signalée", () => {
  // Arrange — seuls deux fichiers sur trois existent
  const racine = atelierJetable();
  writeFileSync(join(racine, "steps", "step-00-init.md"), "Contenu.\n", "utf8");
  writeFileSync(join(racine, "steps", "step-01-analyze.md"), "Contenu.\n", "utf8");

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), TABLEAU, RESOLVEUR);

  // Assert
  assert.ok(workflow);
  const manquante = workflow.etapes.find((e) => e.numero === "02");
  assert.equal(manquante?.present, false);
  assert.equal(manquante?.silences[0].cause, "étape déclarée, fichier absent");
});

test("un fichier présent mais absent du tableau est rendu comme orphelin", () => {
  // Arrange
  const racine = atelierJetable();
  for (const nom of ["step-00-init", "step-01-analyze", "step-02-plan", "step-99-oublie"]) {
    writeFileSync(join(racine, "steps", `${nom}.md`), "Contenu.\n", "utf8");
  }

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), TABLEAU, RESOLVEUR);

  // Assert
  assert.ok(workflow);
  assert.equal(workflow.orphelins.length, 1);
  assert.ok(workflow.orphelins[0].endsWith("step-99-oublie.md"));
});

test("seuls les noms qui existent réellement sont résolus", () => {
  // Arrange — `Explore` est un agent intégré, absent du disque : on l'ignore
  const racine = atelierJetable();
  writeFileSync(
    join(racine, "steps", "step-00-init.md"),
    "Délègue à `test-builder`, puis à `Explore`, et charge `grilling`.\n",
    "utf8",
  );
  writeFileSync(join(racine, "steps", "step-01-analyze.md"), "Rien.\n", "utf8");
  writeFileSync(join(racine, "steps", "step-02-plan.md"), "Rien.\n", "utf8");

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), TABLEAU, RESOLVEUR);

  // Assert
  assert.deepEqual(workflow?.etapes[0].agents, ["test-builder"]);
  assert.deepEqual(workflow?.etapes[0].competences, ["grilling"]);
});

test("une compétence sans tableau d'étapes n'est pas un workflow", () => {
  // Arrange
  const racine = atelierJetable();

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), "## Ce que tu fais\n\nDu texte.\n", RESOLVEUR);

  // Assert
  assert.equal(workflow, null);
});

test("un arrêt dur mentionné en passant dans un corps d'étape n'est pas compté", () => {
  // Arrange — la formulation exacte de halo/step-01, qui NIE avoir un arrêt dur
  const racine = atelierJetable();
  writeFileSync(join(racine, "steps", "step-00-init.md"), "Rien.\n", "utf8");
  writeFileSync(
    join(racine, "steps", "step-01-analyze.md"),
    "# Étape 01 — Analyse\n\nCet arrêt ne remplace pas l'arrêt dur du plan (`step-02`).\n",
    "utf8",
  );
  writeFileSync(join(racine, "steps", "step-02-plan.md"), "# Étape 02 — Plan (arrêt dur `ok`)\n", "utf8");

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), TABLEAU, RESOLVEUR);

  // Assert
  assert.equal(workflow?.etapes[1].arretDur, false, "une négation ne déclare pas un arrêt");
  assert.equal(workflow?.etapes[2].arretDur, true, "le titre de l'étape 02, lui, le déclare");
});

test("les arrêts annoncés dans une section du SKILL.md sont repris", () => {
  // Arrange — la convention de `lancer` : une section qui énumère les étapes
  const racine = atelierJetable();
  for (const nom of ["step-00-init", "step-01-analyze", "step-02-plan"]) {
    writeFileSync(join(racine, "steps", `${nom}.md`), "Rien.\n", "utf8");
  }
  const corps = `${TABLEAU}\n## Deux arrêts durs\n\n1. **Fin du cadrage** (étape 01) — attends.\n2. **Palier** (étape 02) — attends aussi.\n\n## Suite\n\nÉtape 00 n'est pas concernée.\n`;

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), corps, RESOLVEUR);

  // Assert
  assert.deepEqual(
    workflow?.etapes.filter((e) => e.arretDur).map((e) => e.numero),
    ["01", "02"],
  );
});

test("un titre qui NIE un arrêt dur n'en déclare pas un", () => {
  // Arrange — la formulation exacte de giva-flow/step-04, qui en nie un
  const racine = atelierJetable();
  writeFileSync(join(racine, "steps", "step-00-init.md"), "Rien.\n", "utf8");
  writeFileSync(
    join(racine, "steps", "step-01-analyze.md"),
    "### Montrer la surface — point d'information, pas arrêt dur\n",
    "utf8",
  );
  writeFileSync(join(racine, "steps", "step-02-plan.md"), "# Étape 02 — Plan (arrêt dur `ok`)\n", "utf8");

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), TABLEAU, RESOLVEUR);

  // Assert
  assert.deepEqual(workflow?.etapes.filter((e) => e.arretDur).map((e) => e.numero), ["02"]);
});

test("un tableau à quatre colonnes et à liens Markdown est lu", () => {
  // Arrange — la forme de giva-flow : le marqueur vit dans une colonne dédiée
  const racine = atelierJetable();
  for (const n of ["00-depart", "01-suite", "02-plan"]) {
    writeFileSync(join(racine, "steps", `step-${n}.md`), "Rien.\n", "utf8");
  }
  const corps = [
    "| # | Étape | Rôle | Arrêt |",
    "|---|---|---|---|",
    "| 0 | [steps/step-00-depart.md](steps/step-00-depart.md) | Départ | — |",
    "| 1 | [steps/step-01-suite.md](steps/step-01-suite.md) | Suite | **ARRÊT DUR 1** |",
  ].join("\n");

  // Act
  const workflow = lireWorkflow(join(racine, "SKILL.md"), corps, RESOLVEUR);

  // Assert
  assert.equal(workflow?.etapes.length, 2);
  assert.equal(workflow?.etapes[0].role, "Départ", "le rôle est la cellule qui suit le lien");
  assert.deepEqual(workflow?.etapes.filter((e) => e.arretDur).map((e) => e.numero), ["1"]);
});
