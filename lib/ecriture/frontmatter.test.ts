/**
 * L'écriture ne doit rien casser de ce qu'elle ne vise pas.
 *
 * Le test central est celui de `halo` : une ligne que YAML strict refuse doit
 * ressortir identique quand on modifie une autre ligne.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { EcritureRefusee, remplacerChamps, remplacerCorps } from "./frontmatter.ts";

const HALO = [
  "---",
  "name: halo",
  "description: Pipeline HALO.",
  "argument-hint: [step] <demande en langage naturel>",
  "disable-model-invocation: true",
  "---",
  "",
  "Le corps du fichier.",
  "",
].join("\n");

test("modifier une clé laisse les autres lignes intactes, y compris celles que YAML refuse", () => {
  // Arrange
  const attendue = "argument-hint: [step] <demande en langage naturel>";

  // Act
  const ecrit = remplacerChamps(HALO, { description: "Une autre description." });

  // Assert
  assert.ok(ecrit.includes(attendue), "la ligne piégeuse doit ressortir mot pour mot");
  assert.ok(ecrit.includes("description: Une autre description."));
  assert.ok(ecrit.includes("disable-model-invocation: true"));
  assert.ok(ecrit.endsWith("Le corps du fichier.\n"));
});

test("une clé absente est ajoutée à la fin de l'en-tête", () => {
  // Arrange
  const brut = "---\nname: a\n---\n\nCorps.\n";

  // Act
  const ecrit = remplacerChamps(brut, { description: "Neuve." });

  // Assert
  assert.equal(ecrit, "---\nname: a\ndescription: Neuve.\n---\n\nCorps.\n");
});

test("une valeur vide retire la clé", () => {
  // Arrange
  const brut = "---\nname: a\nargument-hint: <x>\n---\n\nCorps.\n";

  // Act
  const ecrit = remplacerChamps(brut, { "argument-hint": "" });

  // Assert
  assert.ok(!ecrit.includes("argument-hint"));
  assert.ok(ecrit.includes("name: a"));
});

test("remplacer le corps ne touche pas au frontmatter", () => {
  // Arrange & Act
  const ecrit = remplacerCorps(HALO, "\nUn corps tout neuf.\n");

  // Assert
  assert.ok(ecrit.includes("argument-hint: [step] <demande en langage naturel>"));
  assert.ok(ecrit.endsWith("Un corps tout neuf.\n"));
  assert.ok(!ecrit.includes("Le corps du fichier."));
});

test("un fichier sans frontmatter est refusé plutôt que réécrit au hasard", () => {
  // Arrange
  const brut = "# Juste du markdown\n";

  // Act & Assert
  assert.throws(() => remplacerChamps(brut, { name: "x" }), EcritureRefusee);
});
