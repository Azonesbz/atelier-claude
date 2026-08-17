/**
 * Le droit d'écrire : qui l'ouvre, qui le ferme, et surtout qui ne le ferme pas.
 *
 * L'achat est unique et la licence perpétuelle. La conséquence tient en une
 * phrase, et c'est elle que ces tests protègent : **rien ne doit se refermer
 * sur quelqu'un qui a payé**, sauf le service joint et catégorique. Un jeton
 * expiré, un service muet, un avion — aucun n'est un refus.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { doitReverifier, DUREE_DU_CACHE, tranche } from "./droit.ts";

const PAYE = { droit: true, verifieLe: 1_000_000 };
const PAS_ENCORE = { droit: false, verifieLe: 0 };

test("sans session, il n'y a pas de droit à trancher", () => {
  // Act & Assert
  assert.deepEqual(tranche(null, null), { etat: "deconnecte" });
});

test("le service dit oui : l'écriture s'ouvre", () => {
  // Act
  const etat = tranche(PAS_ENCORE, { droit: true });

  // Assert
  assert.equal(etat.etat, "ouverte");
});

test("le service joint et catégorique referme — c'est le remboursement", () => {
  // Act
  const etat = tranche(PAYE, { droit: false, raison: "Cet achat a été remboursé." });

  // Assert
  assert.equal(etat.etat, "refusee");
  assert.match("raison" in etat ? etat.raison : "", /rembours/);
});

test("service injoignable : quelqu'un qui a payé garde son écriture", () => {
  // Arrange — l'acheteur dans un train, ou le service en panne
  // Act
  const etat = tranche(PAYE, null);

  // Assert — la garantie centrale du produit : une panne n'est pas un refus
  assert.equal(etat.etat, "ouverte");
});

test("service injoignable et jamais vérifié : on n'ouvre pas pour autant", () => {
  // Act
  const etat = tranche(PAS_ENCORE, null);

  // Assert — le doute ne profite qu'à celui dont le paiement a déjà été constaté
  assert.equal(etat.etat, "refusee");
});

test("un jeton expiré ne referme pas l'écriture d'un acheteur", () => {
  // Arrange — le rafraîchissement a échoué, donc aucune réponse du service
  // Act
  const etat = tranche({ droit: true, verifieLe: 1 }, null);

  // Assert — le jeton établit le droit, il ne le maintient pas
  assert.equal(etat.etat, "ouverte");
});

test("un cache frais dispense de rappeler le service", () => {
  // Arrange
  const maintenant = 2_000_000;

  // Act & Assert
  assert.equal(doitReverifier({ droit: true, verifieLe: maintenant - 1000 }, maintenant), false);
});

test("un cache périmé fait rappeler le service, pour attraper un remboursement", () => {
  // Arrange
  const maintenant = 2_000_000;

  // Act & Assert
  assert.equal(
    doitReverifier({ droit: true, verifieLe: maintenant - DUREE_DU_CACHE - 1 }, maintenant),
    true,
  );
});

test("jamais vérifié : on rappelle le service sans attendre l'échéance", () => {
  // Act & Assert
  assert.equal(doitReverifier(PAS_ENCORE, 2_000_000), true);
});

test("une date de vérification dans le futur ne gèle pas la revérification", () => {
  // Arrange — horloge reculée, ou fichier bricolé à la main
  const cache = { droit: true, verifieLe: 9_000_000 };

  // Act & Assert — sinon le cache ne périmerait plus jamais
  assert.equal(doitReverifier(cache, 2_000_000), true);
});
