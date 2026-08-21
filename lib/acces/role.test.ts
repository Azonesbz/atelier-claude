/**
 * Lequel des deux rôles cette instance tient-elle ?
 *
 * Sur un domaine public, l'application locale n'existe pas : elle lirait le
 * `.claude` du serveur, et ses routes d'écriture viseraient ce même disque.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { estPublic } from "./role.ts";

afterEach(() => {
  delete process.env.ATELIER_PUBLIC;
});

test("sans la variable, l'instance est locale — le cas de toute machine d'utilisateur", () => {
  // Arrange
  delete process.env.ATELIER_PUBLIC;

  // Act & Assert
  assert.equal(estPublic(), false);
});

test("la variable posée rend l'instance publique", () => {
  // Arrange
  process.env.ATELIER_PUBLIC = "1";

  // Act & Assert
  assert.equal(estPublic(), true);
});

test("une valeur vide ne rend pas public — le piège classique du .env", () => {
  // Arrange
  process.env.ATELIER_PUBLIC = "";

  // Act & Assert — sinon une ligne `ATELIER_PUBLIC=` éteindrait l'outil local
  assert.equal(estPublic(), false);
});
