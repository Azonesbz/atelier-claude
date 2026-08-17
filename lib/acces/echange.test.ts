/**
 * La lecture de la réponse du fournisseur.
 *
 * Elle arrive par le réseau : elle peut être tronquée, malformée, ou ne pas
 * contenir ce qu'on avait demandé. Rien n'y est supposé.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { lireJetons } from "./echange.ts";

const COMPLETE = {
  access_token: "at_xxx",
  refresh_token: "rt_yyy",
  expires_in: 3600,
  token_type: "Bearer",
};

test("une réponse complète rend les trois valeurs utiles", () => {
  // Act
  const jetons = lireJetons(COMPLETE);

  // Assert
  assert.deepEqual(jetons, { acces: "at_xxx", rafraichissement: "rt_yyy", expireDans: 3600 });
});

test("sans jeton d'accès, il n'y a rien à garder", () => {
  // Act & Assert
  assert.equal(lireJetons({ refresh_token: "rt_yyy", expires_in: 3600 }), null);
});

test("un refus du fournisseur n'est pas confondu avec un succès", () => {
  // Arrange — le corps d'erreur OAuth standard
  const refus = { error: "invalid_grant", error_description: "code expiré" };

  // Act & Assert
  assert.equal(lireJetons(refus), null);
});

test("l'absence de jeton de rafraîchissement est tolérée, pas inventée", () => {
  // Arrange — le fournisseur peut refuser `offline_access`
  const sansRafraichissement = { access_token: "at_xxx", expires_in: 3600 };

  // Act
  const jetons = lireJetons(sansRafraichissement);

  // Assert — le droit d'écrire survit sans lui : il est établi, pas maintenu
  assert.equal(jetons?.acces, "at_xxx");
  assert.equal(jetons?.rafraichissement, null);
});

test("une durée absente ou absurde retombe sur une valeur sûre", () => {
  // Act & Assert — jamais NaN dans une date d'expiration
  for (const brute of [{}, { expires_in: "bientôt" }, { expires_in: -5 }, { expires_in: null }]) {
    const jetons = lireJetons({ access_token: "at_xxx", ...brute });
    assert.ok(
      typeof jetons?.expireDans === "number" && jetons.expireDans > 0,
      `durée invalide pour ${JSON.stringify(brute)} : ${jetons?.expireDans}`,
    );
  }
});

test("ce qui n'est pas un objet ne devient pas des jetons", () => {
  // Act & Assert
  for (const brute of [null, undefined, "at_xxx", 42, []]) {
    assert.equal(lireJetons(brute), null, `${JSON.stringify(brute)} doit valoir null`);
  }
});
