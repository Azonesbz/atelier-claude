/**
 * La clé de licence : elle doit être infalsifiable sans le secret.
 */

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { clientDeLaCle, fabriquerCle, LicenceInvalide } from "./cle.ts";

const SECRET = "un-secret-de-service-assez-long";
let ancien: string | undefined;

before(() => {
  ancien = process.env.ATELIER_LICENCE_SECRET;
  process.env.ATELIER_LICENCE_SECRET = SECRET;
});
after(() => {
  if (ancien === undefined) delete process.env.ATELIER_LICENCE_SECRET;
  else process.env.ATELIER_LICENCE_SECRET = ancien;
});

test("une clé fabriquée rend son client", () => {
  // Arrange
  const client = "cus_QxYz123456";

  // Act
  const cle = fabriquerCle(client);

  // Assert
  assert.ok(cle.startsWith("AC-"));
  assert.equal(clientDeLaCle(cle), client);
});

test("une signature modifiée est rejetée", () => {
  // Arrange
  const cle = fabriquerCle("cus_QxYz123456");
  const trafiquee = `${cle.slice(0, -1)}${cle.at(-1) === "a" ? "b" : "a"}`;

  // Act & Assert
  assert.equal(clientDeLaCle(trafiquee), null);
});

test("changer le client sans refaire la signature est rejeté", () => {
  // Arrange — la tentative évidente : prendre sa clé et viser un autre compte
  const [prefixe, , signature] = fabriquerCle("cus_moi").split("-");
  const autre = Buffer.from("cus_quelquun_dautre", "utf8").toString("base64url");

  // Act & Assert
  assert.equal(clientDeLaCle(`${prefixe}-${autre}-${signature}`), null);
});

test("une clé fabriquée avec un autre secret est rejetée", () => {
  // Arrange
  process.env.ATELIER_LICENCE_SECRET = "un-autre-secret-tout-aussi-long";
  const etrangere = fabriquerCle("cus_QxYz123456");
  process.env.ATELIER_LICENCE_SECRET = SECRET;

  // Act & Assert
  assert.equal(clientDeLaCle(etrangere), null);
});

test("un identifiant qui n'est pas un client Stripe est refusé à la fabrication", () => {
  // Act & Assert
  assert.throws(() => fabriquerCle("sub_123"), LicenceInvalide);
});

test("sans secret, aucune clé n'est fabriquée ni acceptée", () => {
  // Arrange
  delete process.env.ATELIER_LICENCE_SECRET;

  // Act & Assert
  assert.throws(() => fabriquerCle("cus_x"), LicenceInvalide);
  assert.equal(clientDeLaCle("AC-abc-def"), null, "pas de secret : on refuse, on ne lève pas");
  process.env.ATELIER_LICENCE_SECRET = SECRET;
});

test("une clé mal formée ne fait pas tomber la vérification", () => {
  // Act & Assert
  for (const brut of ["", "AC", "AC-x", "XX-a-b", "AC-!!!-zzz"]) {
    assert.equal(clientDeLaCle(brut), null, `« ${brut} » doit être refusé sans lever`);
  }
});
