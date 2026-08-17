/**
 * L'émetteur se déduit de la clé publiable — une variable de moins à remplir à la main.
 *
 * Une clé publiable Clerk est `pk_test_` ou `pk_live_` suivi de l'URL de l'API
 * frontale en base64, terminée par un `$`. Rien de secret là-dedans : elle part
 * dans chaque page, et c'est bien pourquoi elle peut voyager avec le produit.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { emetteurDepuisClePubliable } from "./emetteur.ts";

/** base64 de « exemple.accounts.dev$ ». */
const TEST = "pk_test_ZXhlbXBsZS5hY2NvdW50cy5kZXYk";
/** base64 de « clerk.exemple.com$ ». */
const LIVE = "pk_live_Y2xlcmsuZXhlbXBsZS5jb20k";

test("une clé de développement rend son API frontale", () => {
  // Act & Assert
  assert.equal(emetteurDepuisClePubliable(TEST), "https://exemple.accounts.dev");
});

test("une clé de production rend son API frontale", () => {
  // Act & Assert
  assert.equal(emetteurDepuisClePubliable(LIVE), "https://clerk.exemple.com");
});

test("l'émetteur n'a jamais de barre finale, sinon les adresses doublent la barre", () => {
  // Act
  const emetteur = emetteurDepuisClePubliable(LIVE);

  // Assert
  assert.ok(!emetteur?.endsWith("/"));
});

test("une clé qui n'en est pas une vaut null, sans lever", () => {
  // Arrange — la configuration est remplie à la main : elle sera fausse un jour
  const fausses = [
    "",
    "pk_live_",
    "sk_live_Y2xlcmsuZXhlbXBsZS5jb20k", // une clé secrète collée par erreur
    "pk_live_!!!!!!",
    "Y2xlcmsuZXhlbXBsZS5jb20k", // sans préfixe
    "pk_live_Y2xlcmsuZXhlbXBsZS5jb20", // sans le $ terminal
  ];

  // Act & Assert
  for (const brute of fausses) {
    assert.equal(emetteurDepuisClePubliable(brute), null, `« ${brute.slice(0, 12)}… » doit valoir null`);
  }
});

test("une clé secrète ne doit jamais servir d'émetteur, même bien formée", () => {
  // Arrange — le collage le plus probable : la mauvaise des deux clés du tableau de bord
  const secrete = `sk_live_${Buffer.from("clerk.exemple.com$", "utf8").toString("base64")}`;

  // Act & Assert
  assert.equal(emetteurDepuisClePubliable(secrete), null);
});
