/**
 * Lequel des deux rôles cette instance tient-elle ?
 *
 * Le SDK Clerk ne tolère pas l'absence de ses clés : `ClerkProvider` et
 * `clerkMiddleware()` lèvent. Or sur la machine d'un acheteur elles sont
 * absentes par construction — la clé secrète ne peut pas y descendre. Sans ce
 * prédicat, l'installation par défaut de la CLI éteint l'application entière
 * chez quiconque n'a pas de compte, y compris pour la lecture, qui est gratuite.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { estService } from "./role.ts";

const CLES = ["CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] as const;

function poser(valeurs: Partial<Record<(typeof CLES)[number], string>>) {
  for (const cle of CLES) delete process.env[cle];
  for (const [cle, valeur] of Object.entries(valeurs)) process.env[cle] = valeur;
}

afterEach(() => {
  for (const cle of CLES) delete process.env[cle];
});

test("sans clés Clerk, l'instance est locale — et tout doit continuer de marcher", () => {
  // Arrange — le cas de l'acheteur : il lit son dossier .claude, rien de plus
  poser({});

  // Act & Assert
  assert.equal(estService(), false);
});

test("avec les deux clés, l'instance est le service déployé", () => {
  // Arrange
  poser({ CLERK_SECRET_KEY: "sk_test_xxx", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_yyy" });

  // Act & Assert
  assert.equal(estService(), true);
});

test("la clé publiable seule ne fait pas un service", () => {
  // Arrange — c'est exactement l'état d'une machine d'acheteur qui se connecte :
  // elle connaît la clé publiable, qui est publique, et rien de secret.
  poser({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_yyy" });

  // Act & Assert — sinon le SDK démarrerait là où il n'a rien à faire
  assert.equal(estService(), false);
});

test("la clé secrète seule ne fait pas un service non plus", () => {
  // Arrange — configuration à moitié posée : mieux vaut ne pas démarrer le SDK
  poser({ CLERK_SECRET_KEY: "sk_test_xxx" });

  // Act & Assert
  assert.equal(estService(), false);
});

test("une valeur vide ne compte pas pour une clé", () => {
  // Arrange — une variable déclarée sans valeur est le piège classique du .env
  poser({ CLERK_SECRET_KEY: "", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "" });

  // Act & Assert
  assert.equal(estService(), false);
});
