/**
 * L'identifiant GitHub saisi par l'acheteur, au moment de payer.
 *
 * Il vient d'un champ libre rempli sur la page de paiement : c'est la seule
 * donnée du parcours que l'acheteur écrit lui-même, et elle part ensuite dans
 * une URL d'API. Elle est donc validée strictement plutôt que nettoyée — un
 * identifiant douteux se refuse, il ne se répare pas.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { lireIdentifiantGithub } from "./identifiant.ts";

test("un identifiant normal passe, débarrassé de ses espaces", () => {
  // Act & Assert
  assert.equal(lireIdentifiantGithub("  Azonesbz  "), "Azonesbz");
});

test("les tirets internes sont permis, GitHub les autorise", () => {
  // Act & Assert
  assert.equal(lireIdentifiantGithub("vincent-avez"), "vincent-avez");
});

test("une URL de profil est acceptée et réduite à l'identifiant", () => {
  // Arrange — l'acheteur colle son profil plutôt que son pseudo, c'est fréquent
  // Act & Assert
  assert.equal(lireIdentifiantGithub("https://github.com/Azonesbz"), "Azonesbz");
  assert.equal(lireIdentifiantGithub("github.com/Azonesbz/"), "Azonesbz");
  assert.equal(lireIdentifiantGithub("@Azonesbz"), "Azonesbz");
});

test("ce qui ne peut pas être un identifiant GitHub est refusé", () => {
  // Arrange — les règles de GitHub : 39 caractères au plus, alphanumérique et
  // tiret, ni au début ni à la fin, jamais deux tirets de suite.
  const refuses = [
    "", "   ", "-debut", "fin-", "deux--tirets", "a".repeat(40),
    "avec espace", "point.virgule", "slash/dedans", "accentué",
  ];

  // Act & Assert
  for (const brut of refuses) {
    assert.equal(lireIdentifiantGithub(brut), null, `« ${brut} » doit être refusé`);
  }
});

test("une tentative d'injection dans le chemin d'API est refusée", () => {
  // Arrange — la valeur part dans une URL /repos/:proprietaire/:depot/collaborators/:identifiant
  const attaques = [
    "../../admin", "Azonesbz/../autre", "Azonesbz?admin=1", "Azonesbz%2F..",
  ];

  // Act & Assert
  for (const brut of attaques) {
    assert.equal(lireIdentifiantGithub(brut), null, `« ${brut} » doit être refusé`);
  }
});

test("ce qui n'est pas une chaîne ne devient pas un identifiant", () => {
  // Act & Assert
  for (const brut of [null, undefined, 42, {}, []]) {
    assert.equal(lireIdentifiantGithub(brut as never), null);
  }
});
