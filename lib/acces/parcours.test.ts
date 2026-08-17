/**
 * Le parcours d'autorisation : le départ, et surtout ce qu'on refuse au retour.
 *
 * Le retour est la surface exposée. Elle reçoit ce qu'un navigateur veut bien
 * lui donner, sur une machine où rien n'est authentifié — donc chaque champ y
 * est traité comme hostile.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { demarrer, validerRetour } from "./parcours.ts";
import { defiDepuis } from "./pkce.ts";

const FOURNISSEUR = {
  emetteur: "https://clerk.exemple.com",
  clientId: "client_abc",
  redirection: "http://127.0.0.1:4300/api/auth/retour",
};

test("le départ scelle le défi qui correspond au vérifieur gardé", () => {
  // Act
  const { adresse, verifieur } = demarrer(FOURNISSEUR);

  // Assert — si les deux divergeaient, l'échange échouerait seulement en prod
  const envoye = new URL(adresse).searchParams.get("code_challenge");
  assert.equal(envoye, defiDepuis(verifieur));
});

test("deux départs ne partagent ni état ni vérifieur", () => {
  // Act
  const premier = demarrer(FOURNISSEUR);
  const second = demarrer(FOURNISSEUR);

  // Assert
  assert.notEqual(premier.etat, second.etat);
  assert.notEqual(premier.verifieur, second.verifieur);
});

test("l'état est assez long pour ne pas se deviner", () => {
  // Act
  const { etat } = demarrer(FOURNISSEUR);

  // Assert — 16 octets au minimum, sinon il ne protège de rien
  assert.ok(etat.length >= 22, `état trop court : ${etat.length} caractères`);
});

test("un état qui ne correspond pas est refusé", () => {
  // Arrange — la falsification de requête : un tiers déclenche le retour
  const params = new URLSearchParams({ code: "un-code", state: "letat-de-lattaquant" });

  // Act
  const issue = validerRetour(params, { etat: "letat-attendu" });

  // Assert
  assert.ok("erreur" in issue, "un état étranger doit être refusé");
});

test("un état absent est refusé aussi", () => {
  // Act
  const issue = validerRetour(new URLSearchParams({ code: "un-code" }), { etat: "letat-attendu" });

  // Assert
  assert.ok("erreur" in issue);
});

test("un état attendu vide n'ouvre pas la porte", () => {
  // Arrange — le cas du cookie perdu : ne jamais faire correspondre vide à vide
  const params = new URLSearchParams({ code: "un-code", state: "" });

  // Act
  const issue = validerRetour(params, { etat: "" });

  // Assert
  assert.ok("erreur" in issue, "sans état gardé, il n'y a rien à valider");
});

test("le refus du fournisseur est rapporté, pas avalé", () => {
  // Arrange — l'acheteur a cliqué « Annuler » sur la page de connexion
  const params = new URLSearchParams({ error: "access_denied", state: "letat-attendu" });

  // Act
  const issue = validerRetour(params, { etat: "letat-attendu" });

  // Assert
  assert.ok("erreur" in issue && issue.erreur.includes("access_denied"));
});

test("un état juste mais sans code ne passe pas pour un succès", () => {
  // Act
  const issue = validerRetour(new URLSearchParams({ state: "letat-attendu" }), { etat: "letat-attendu" });

  // Assert
  assert.ok("erreur" in issue);
});

test("un retour complet et cohérent rend le code", () => {
  // Arrange
  const params = new URLSearchParams({ code: "le-code", state: "letat-attendu" });

  // Act
  const issue = validerRetour(params, { etat: "letat-attendu" });

  // Assert
  assert.deepEqual(issue, { code: "le-code" });
});
