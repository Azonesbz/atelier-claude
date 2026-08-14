/**
 * Le découpage du frontmatter, et surtout sa tolérance.
 *
 * Le cas `halo` est une régression payée : la première version déclarait morte
 * une compétence parfaitement vivante. Il reste ici pour que ça ne recommence pas.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { decouper } from "./fichiers.ts";

/** La ligne réelle de ~/.claude/skills/halo qui met YAML strict en échec.
 *  `[step]` est lu comme une séquence en flot, puis le texte qui suit surprend. */
const INDICE_HALO = "argument-hint: [step] <demande en langage naturel>";

test("un frontmatter YAML banal est lu strictement", () => {
  // Arrange
  const brut = "---\nname: idee\ndescription: Capturer une idée.\n---\n\nLe corps.\n";

  // Act
  const decoupe = decouper(brut);

  // Assert
  assert.equal(decoupe.enteteValide, true);
  assert.equal(decoupe.tolere, false);
  assert.equal(decoupe.entete.name, "idee");
  assert.equal(decoupe.corps.trim(), "Le corps.");
});

test("un frontmatter que YAML strict refuse reste lu, comme le fait Claude Code", () => {
  // Arrange — l'indice d'argument casse YAML strict ; Claude Code charge quand même
  const brut = `---\nname: halo\ndescription: Pipeline HALO.\n${INDICE_HALO}\ndisable-model-invocation: true\n---\n\nCorps.\n`;

  // Act
  const decoupe = decouper(brut);

  // Assert
  assert.equal(decoupe.enteteValide, true, "ne doit jamais être déclarée illisible");
  assert.equal(decoupe.tolere, true, "doit passer par la lecture ligne à ligne");
  assert.equal(decoupe.entete.name, "halo");
  assert.equal(decoupe.entete["disable-model-invocation"], true);
});

test("les booléens sont convertis, pas laissés en chaîne", () => {
  // Arrange
  const brut = `---\nname: a\n${INDICE_HALO}\nuser-invocable: false\n---\n\nx\n`;

  // Act
  const decoupe = decouper(brut);

  // Assert
  assert.equal(decoupe.tolere, true);
  assert.equal(decoupe.entete["user-invocable"], false);
});

test("un fichier sans délimiteur n'a pas de frontmatter", () => {
  // Arrange
  const brut = "# Juste du markdown\n";

  // Act
  const decoupe = decouper(brut);

  // Assert
  assert.equal(decoupe.enteteValide, false);
  assert.equal(decoupe.corps, brut);
});

test("un frontmatter sans aucune paire cle-valeur est déclaré illisible", () => {
  // Arrange
  const brut = "---\n[ceci n'est ni du yaml ni des paires\n---\n\nCorps.\n";

  // Act
  const decoupe = decouper(brut);

  // Assert
  assert.equal(decoupe.enteteValide, false);
});
