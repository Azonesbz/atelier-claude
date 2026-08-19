/**
 * Le droit d'écrire offert, et qui a le pouvoir de l'offrir.
 *
 * Deux sources de droit désormais : un paiement constaté chez Stripe, ou une
 * faveur accordée par l'administrateur. La seconde existe parce qu'on offre un
 * outil — à un contributeur, à un premier essai, à un ami — sans passer par
 * une caisse qu'il faudrait ensuite rembourser.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { estAdmin, estOffert } from "./faveur.ts";

afterEach(() => {
  delete process.env.ATELIER_ADMIN;
});

test("sans liste d'administrateurs, personne ne l'est", () => {
  // Arrange — un déploiement mal configuré ne doit sacrer personne
  delete process.env.ATELIER_ADMIN;

  // Act & Assert
  assert.equal(estAdmin("vincent.avez22@gmail.com"), false);
});

test("un courriel inscrit sur la liste est administrateur", () => {
  // Arrange
  process.env.ATELIER_ADMIN = "vincent.avez22@gmail.com";

  // Act & Assert
  assert.equal(estAdmin("vincent.avez22@gmail.com"), true);
});

test("la casse et les espaces ne font pas rater la reconnaissance", () => {
  // Arrange — le courriel vient de Clerk, la liste est tapée à la main
  process.env.ATELIER_ADMIN = "  Vincent.Avez22@Gmail.com , autre@exemple.fr ";

  // Act & Assert
  assert.equal(estAdmin("vincent.avez22@gmail.com"), true);
  assert.equal(estAdmin("AUTRE@exemple.fr"), true);
});

test("un courriel absent de la liste ne l'est pas", () => {
  // Arrange
  process.env.ATELIER_ADMIN = "vincent.avez22@gmail.com";

  // Act & Assert
  assert.equal(estAdmin("pirate@exemple.fr"), false);
});

test("un courriel vide ou absent n'est jamais administrateur", () => {
  // Arrange — sinon une entrée vide de la liste sacrerait les anonymes
  process.env.ATELIER_ADMIN = "vincent.avez22@gmail.com,,";

  // Act & Assert
  for (const brut of ["", "   ", null, undefined]) {
    assert.equal(estAdmin(brut as never), false, `« ${brut} » ne doit pas être admin`);
  }
});

test("une faveur accordée ouvre le droit", () => {
  // Act & Assert
  assert.equal(estOffert({ orchaOffert: true }), true);
});

test("tout le reste ne l'ouvre pas", () => {
  // Arrange — la métadonnée est publique côté Clerk : seule la valeur
  // booléenne exacte compte, pas une chaîne « true » qui traînerait.
  for (const brut of [undefined, null, {}, { orchaOffert: false }, { orchaOffert: "true" }, { autre: true }, "true", 1]) {
    // Act & Assert
    assert.equal(estOffert(brut as never), false, `${JSON.stringify(brut)} ne doit rien ouvrir`);
  }
});
