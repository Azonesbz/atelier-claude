/**
 * Le rattachement d'un compte à son client Stripe.
 *
 * Aucune table : le lien vit dans les métadonnées du client Stripe, et la
 * recherche est la seule façon de le retrouver. Or cette recherche prend une
 * requête textuelle — donc un identifiant tordu doit être neutralisé, pas
 * concaténé tel quel.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAMP_COMPTE, clientDuResultat, requeteDuCompte } from "./rattachement.ts";

test("la requête vise le champ de métadonnée convenu", () => {
  // Act
  const requete = requeteDuCompte("user_123");

  // Assert
  assert.equal(requete, `metadata['${CHAMP_COMPTE}']:'user_123'`);
});

test("une apostrophe dans l'identifiant ne casse pas la requête", () => {
  // Arrange — la requête Stripe est du texte : une apostrophe la terminerait
  const tordu = "user_' OR metadata['x']:'";

  // Act
  const requete = requeteDuCompte(tordu);

  // Assert — la valeur reste une seule clause : plus une seule apostrophe
  // libre entre les délimiteurs, sinon Stripe lirait la suite comme du code.
  const prefixe = `metadata['${CHAMP_COMPTE}']:'`;
  assert.ok(requete !== null, "un identifiant tordu reste un identifiant");
  assert.ok(requete.startsWith(prefixe) && requete.endsWith("'"));

  const valeur = requete.slice(prefixe.length, -1);
  const libres = valeur.match(/(?<!\\)'/g) ?? [];
  assert.equal(libres.length, 0, `apostrophes non échappées dans « ${valeur} »`);
});

test("un identifiant vide ne produit pas de requête", () => {
  // Act & Assert — sinon elle ramènerait le premier client venu
  assert.equal(requeteDuCompte(""), null);
  assert.equal(requeteDuCompte("   "), null);
});

test("un seul client trouvé rend son identifiant", () => {
  // Act & Assert
  assert.equal(clientDuResultat({ data: [{ id: "cus_abc" }] }), "cus_abc");
});

test("aucun client trouvé vaut null", () => {
  // Act & Assert
  assert.equal(clientDuResultat({ data: [] }), null);
});

test("plusieurs clients pour un même compte : on prend le premier, sans lever", () => {
  // Arrange — ne devrait pas arriver, mais un doublon ne doit pas tout bloquer
  const resultat = { data: [{ id: "cus_premier" }, { id: "cus_second" }] };

  // Act & Assert
  assert.equal(clientDuResultat(resultat), "cus_premier");
});

test("un résultat malformé vaut null plutôt qu'une exception", () => {
  // Act & Assert
  for (const brut of [null, undefined, {}, { data: null }, { data: [{}] }, { data: "x" }]) {
    assert.equal(clientDuResultat(brut), null, `${JSON.stringify(brut)} doit valoir null`);
  }
});
