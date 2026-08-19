/**
 * Ce qu'on retient d'un événement Stripe, et ce qu'on refuse d'en faire.
 *
 * Le corps arrive par le réseau, signé mais arbitraire. Seul un paiement
 * réellement acquitté ouvre un accès : une session ouverte puis abandonnée ne
 * doit rien déclencher.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { lireLivraison } from "./evenement.ts";

const PAYEE = {
  type: "checkout.session.completed",
  data: {
    object: {
      payment_status: "paid",
      client_reference_id: "user_abc",
      customer_details: { email: "acheteur@exemple.fr" },
      custom_fields: [{ key: "github", text: { value: "Azonesbz" } }],
    },
  },
};

test("une session payée rend le compte, le courriel et l'identifiant", () => {
  // Act
  const l = lireLivraison(PAYEE);

  // Assert
  assert.deepEqual(l, { compte: "user_abc", courriel: "acheteur@exemple.fr", github: "Azonesbz" });
});

test("une session non payée ne livre rien", () => {
  // Arrange — l'acheteur a ouvert la page de paiement puis l'a fermée
  const impayee = JSON.parse(JSON.stringify(PAYEE));
  impayee.data.object.payment_status = "unpaid";

  // Act & Assert
  assert.equal(lireLivraison(impayee), null);
});

test("un autre type d'événement ne livre rien", () => {
  // Arrange — Stripe en envoie beaucoup ; un seul nous concerne
  const autre = { ...PAYEE, type: "payment_intent.created" };

  // Act & Assert
  assert.equal(lireLivraison(autre), null);
});

test("un identifiant GitHub invalide ne livre pas — mais le compte reste connu", () => {
  // Arrange — la faute de frappe est le cas courant, et elle doit se réparer
  const fautif = JSON.parse(JSON.stringify(PAYEE));
  fautif.data.object.custom_fields = [{ key: "github", text: { value: "deux--tirets" } }];

  // Act
  const l = lireLivraison(fautif);

  // Assert — on garde de quoi prévenir l'acheteur plutôt que de tout jeter
  assert.equal(l?.github, null);
  assert.equal(l?.compte, "user_abc");
});

test("un champ personnalisé absent ne fait pas tomber la lecture", () => {
  // Arrange
  const sansChamp = JSON.parse(JSON.stringify(PAYEE));
  delete sansChamp.data.object.custom_fields;

  // Act & Assert
  assert.equal(lireLivraison(sansChamp)?.github, null);
});

test("un corps malformé vaut null, jamais une exception", () => {
  // Act & Assert
  for (const brut of [null, undefined, {}, "texte", 42, { type: "checkout.session.completed" }]) {
    assert.equal(lireLivraison(brut), null, `${JSON.stringify(brut)} doit valoir null`);
  }
});
