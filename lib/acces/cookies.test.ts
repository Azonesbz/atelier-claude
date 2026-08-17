/**
 * Les cookies qui portent le vérifieur et l'état entre le départ et le retour.
 *
 * Ils ne durent que le temps d'un aller-retour vers le fournisseur. Ce sont
 * les seuls cookies de l'application, et leurs attributs ne sont pas
 * décoratifs : c'est eux qui décident si le parcours tient debout.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEPART, lireCookie, poser, retirer } from "./cookies.ts";

test("le cookie est hors de portée du JavaScript de la page", () => {
  // Act
  const pose = poser(DEPART.verifieur, "le-verifieur");

  // Assert — le vérifieur est le secret du parcours : aucun script n'y touche
  assert.match(pose, /HttpOnly/);
});

test("le cookie survit au retour depuis le fournisseur", () => {
  // Act
  const pose = poser(DEPART.etat, "un-etat");

  // Assert — `Lax` laisse passer une navigation de premier plan en GET, ce
  // qu'est exactement le retour OAuth. `Strict` le perdrait, et la connexion
  // échouerait sans que rien ne l'explique.
  assert.match(pose, /SameSite=Lax/);
  assert.ok(!/SameSite=Strict/.test(pose));
});

test("le cookie ne survit pas à un parcours abandonné", () => {
  // Act
  const pose = poser(DEPART.etat, "un-etat");

  // Assert — un état qui traîne des jours est un état qu'on peut rejouer
  const age = Number(pose.match(/Max-Age=(\d+)/)?.[1]);
  assert.ok(age > 0 && age <= 900, `durée de vie déraisonnable : ${age}s`);
});

test("le cookie vaut pour tout le site, pas seulement pour la route de départ", () => {
  // Act & Assert — sinon le retour, sur une autre route, ne le verrait pas
  assert.match(poser(DEPART.etat, "un-etat"), /Path=\//);
});

test("retirer un cookie le fait expirer plutôt que de le vider", () => {
  // Act
  const efface = retirer(DEPART.verifieur);

  // Assert
  assert.match(efface, /Max-Age=0/);
});

test("on relit la valeur qu'on a posée, parmi d'autres cookies", () => {
  // Arrange
  const entete = `autre=zzz; ${DEPART.etat}=letat-cherche; encore=yyy`;

  // Act & Assert
  assert.equal(lireCookie(entete, DEPART.etat), "letat-cherche");
});

test("un cookie absent vaut la chaîne vide, jamais une exception", () => {
  // Act & Assert — le parcours refuse un état vide, donc l'absence se propage
  assert.equal(lireCookie("autre=zzz", DEPART.etat), "");
  assert.equal(lireCookie(null, DEPART.etat), "");
});

test("un nom qui en préfixe un autre ne se confond pas avec lui", () => {
  // Arrange — `atelier_etat` ne doit pas être lu à la place de `atelier_etat_x`
  const entete = `${DEPART.etat}_autre=mauvais; ${DEPART.etat}=bon`;

  // Act & Assert
  assert.equal(lireCookie(entete, DEPART.etat), "bon");
});
