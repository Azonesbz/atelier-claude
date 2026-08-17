/**
 * PKCE : ce qui remplace le secret client qu'une application locale ne peut pas garder.
 *
 * Toutes les instances partagent le même `client_id` — il est distribué avec le
 * produit, donc public par construction. Ce qui rend le flux sûr, c'est que le
 * code d'autorisation ne s'échange qu'avec le vérifieur qui a servi à fabriquer
 * le défi, et que celui-là ne quitte jamais la machine.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { defiDepuis, fabriquerDefi } from "./pkce.ts";

/** RFC 7636 §4.1 : 43 à 128 caractères, pris dans l'alphabet non réservé. */
const NON_RESERVE = /^[A-Za-z0-9\-._~]+$/;

test("un vérifieur respecte la longueur et l'alphabet de la RFC 7636", () => {
  // Act
  const { verifieur } = fabriquerDefi();

  // Assert
  assert.ok(verifieur.length >= 43, `trop court : ${verifieur.length}`);
  assert.ok(verifieur.length <= 128, `trop long : ${verifieur.length}`);
  assert.match(verifieur, NON_RESERVE);
});

test("le défi est le SHA-256 du vérifieur, en base64url sans remplissage", () => {
  // Arrange
  const verifieur = "un-verifieur-de-test-assez-long-pour-la-rfc-7636";

  // Act
  const defi = defiDepuis(verifieur);

  // Assert
  assert.equal(defi, createHash("sha256").update(verifieur).digest("base64url"));
  assert.ok(!defi.includes("="), "le remplissage base64 casse la comparaison côté serveur");
});

test("la méthode annoncée est bien celle qui est appliquée", () => {
  // Act
  const { verifieur, defi, methode } = fabriquerDefi();

  // Assert — S256 annoncé et S256 calculé : sinon l'échange échoue à l'exécution
  assert.equal(methode, "S256");
  assert.equal(defi, defiDepuis(verifieur));
});

test("deux défis d'affilée ne se ressemblent pas", () => {
  // Act — le vérifieur doit être tiré au hasard à chaque tentative de connexion
  const premier = fabriquerDefi();
  const second = fabriquerDefi();

  // Assert
  assert.notEqual(premier.verifieur, second.verifieur);
  assert.notEqual(premier.defi, second.defi);
});
