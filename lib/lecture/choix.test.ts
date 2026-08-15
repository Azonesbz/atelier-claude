/**
 * Le choix du projet, et sa place dans l'ordre de résolution.
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { effacerChoix, ecrireChoix, lireChoix } from "./choix.ts";
import { racineProjet } from "./fichiers.ts";

const DEPART = process.cwd();
after(() => {
  effacerChoix();
  process.chdir(DEPART);
});

function projetJetable(): string {
  const racine = mkdtempSync(join(tmpdir(), "choix-"));
  mkdirSync(join(racine, ".claude"));
  return racine;
}

test("un choix enregistré désigne la racine lue", () => {
  // Arrange
  delete process.env.ATELIER_PROJET;
  const projet = projetJetable();

  // Act
  ecrireChoix(projet);

  // Assert
  assert.equal(lireChoix(), projet);
  assert.equal(racineProjet(), join(projet, ".claude"));
});

test("ATELIER_PROJET l'emporte sur le choix enregistré", () => {
  // Arrange — un lancement explicite doit rester explicite
  const choisi = projetJetable();
  const impose = projetJetable();
  ecrireChoix(choisi);
  process.env.ATELIER_PROJET = impose;

  // Act
  const racine = racineProjet();

  // Assert
  assert.equal(racine, join(impose, ".claude"));
  delete process.env.ATELIER_PROJET;
});

test("effacer le choix rend la main à la détection", () => {
  // Arrange
  delete process.env.ATELIER_PROJET;
  ecrireChoix(projetJetable());

  // Act
  effacerChoix();

  // Assert
  assert.equal(lireChoix(), null);
});

test("un choix qui ne porte pas de .claude ne rend rien", () => {
  // Arrange — le dossier existe, mais il n'y a rien à y lire
  delete process.env.ATELIER_PROJET;
  ecrireChoix(mkdtempSync(join(tmpdir(), "vide-")));

  // Act & Assert
  assert.equal(racineProjet(), null, "ne doit pas remonter l'arborescence en douce");
});
