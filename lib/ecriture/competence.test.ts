/**
 * L'écriture sur un vrai disque, dans un dossier jetable.
 *
 * Rien de la configuration réelle n'est lu ni modifié : CLAUDE_CONFIG_DIR
 * pointe sur un répertoire temporaire pour toute la durée du fichier.
 */

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

const RACINE = mkdtempSync(join(tmpdir(), "atelier-"));
const CHEMIN = join(RACINE, "skills", "halo", "SKILL.md");
const INDICE = "argument-hint: [step] <demande en langage naturel>";

const ORIGINAL = [
  "---",
  "name: halo",
  "description: Pipeline HALO.",
  INDICE,
  "disable-model-invocation: true",
  "---",
  "",
  "Le corps.",
  "",
].join("\n");

let ancienne: string | undefined;

before(() => {
  ancienne = process.env.CLAUDE_CONFIG_DIR;
  process.env.CLAUDE_CONFIG_DIR = RACINE;
  process.env.ATELIER_PROJET = RACINE;
  mkdirSync(join(RACINE, "skills", "halo"), { recursive: true });
  writeFileSync(CHEMIN, ORIGINAL, "utf8");
});

after(() => {
  if (ancienne === undefined) delete process.env.CLAUDE_CONFIG_DIR;
  else process.env.CLAUDE_CONFIG_DIR = ancienne;
});

test("modifier la description laisse la ligne que YAML refuse intacte", async () => {
  // Arrange
  const { enregistrerCompetence } = await import("./competence.ts");

  // Act
  enregistrerCompetence(CHEMIN, { description: "Une description neuve." });

  // Assert
  const ecrit = readFileSync(CHEMIN, "utf8");
  assert.ok(ecrit.includes(INDICE), "la ligne piégeuse doit ressortir mot pour mot");
  assert.ok(ecrit.includes("description: Une description neuve."));
  assert.ok(ecrit.includes("disable-model-invocation: true"));
  assert.ok(ecrit.endsWith("Le corps.\n"));
});

test("une compétence de plugin est refusée, pas écrasée", async () => {
  // Arrange
  const { verifierChemin } = await import("./competence.ts");
  const dansUnPlugin = join(RACINE, "plugins", "marketplaces", "m", "plugins", "p", "skills", "x", "SKILL.md");

  // Act & Assert
  assert.throws(() => verifierChemin(dansUnPlugin), /plugin/i);
});

test("un fichier hors des racines connues est refusé", async () => {
  // Arrange
  const { verifierChemin } = await import("./competence.ts");

  // Act & Assert
  assert.throws(() => verifierChemin("/etc/skills/x/SKILL.md"), /hors des dossiers/i);
});

test("un fichier qui n'est pas un SKILL.md est refusé", async () => {
  // Arrange
  const { verifierChemin } = await import("./competence.ts");

  // Act & Assert
  assert.throws(() => verifierChemin(join(RACINE, "settings.json")), /SKILL\.md/);
});
