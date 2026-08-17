/**
 * Le montant s'affiche, mais ne s'écrit pas dans le code.
 *
 * Deux règles se contredisent en apparence. Celle du produit : le prix vit
 * dans le tarif Stripe, pour se changer sans redéployer. Celle de la page qui
 * vend : un bouton d'achat sans montant est le défaut le plus coûteux du
 * panel concurrent. Elles tiennent ensemble si le montant est *lu* au rendu.
 *
 * D'où le seul point à éprouver ici : le formatage, qui est pur. La lecture
 * chez Stripe, elle, est un appel réseau — on vérifie seulement qu'elle se
 * tait quand rien n'est configuré, plutôt que d'inventer un prix de repli.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { formaterMontant, lireMontantAffiche } from "./tarif.ts";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
});

test("un montant rond ne traîne pas de décimales", () => {
  // Arrange : 39 € pile, tels que Stripe les stocke — en centimes.
  const centimes = 3900;

  // Act
  const rendu = formaterMontant(centimes, "eur");

  // Assert : « 39,00 € » ferait lourd sur un bouton. On veut « 39 € ».
  assert.match(rendu, /^39\s*€$/u);
});

test("un montant à centimes garde ses deux décimales", () => {
  // Arrange
  const centimes = 3950;

  // Act
  const rendu = formaterMontant(centimes, "eur");

  // Assert : arrondir ici afficherait un prix faux sur la page.
  assert.match(rendu, /^39,50\s*€$/u);
});

test("la devise vient de Stripe, elle n'est pas supposée euro", () => {
  // Arrange : le même tarif, libellé en dollars.
  const centimes = 900;

  // Act
  const rendu = formaterMontant(centimes, "usd");

  // Assert
  assert.match(rendu, /9,00\s*\$US|\$9\.00|9\s*\$/u);
});

test("sans tarif configuré, aucun montant — et surtout aucun prix de repli", async () => {
  // Arrange : c'est l'état réel du service tant que le tarif Stripe n'existe pas.
  delete process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

  // Act
  const montant = await lireMontantAffiche();

  // Assert : `null` fait tomber le montant du libellé. Un prix inventé, lui,
  // mentirait à l'acheteur — c'est la seule issue interdite.
  assert.equal(montant, null);
});
