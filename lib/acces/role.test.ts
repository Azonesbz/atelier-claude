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
import { estPublic, estService } from "./role.ts";

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

/* Le rôle public : le déploiement ne doit PAS servir l'application locale.
   Elle lit et écrit un dossier `.claude` — sur un serveur, ce serait celui du
   serveur. Un inventaire du disque de la machine hôte exposé à Internet, et
   des routes d'écriture qui visent ce même disque : rien de tout cela n'a de
   raison d'exister sur un domaine public. */

test("sans la variable, l'instance n'est pas publique — le cas de toute machine d'acheteur", () => {
  // Arrange
  delete process.env.ATELIER_PUBLIC;

  // Act & Assert
  assert.equal(estPublic(), false);
});

test("la variable posée rend l'instance publique", () => {
  // Arrange
  process.env.ATELIER_PUBLIC = "1";

  // Act & Assert
  assert.equal(estPublic(), true);
  delete process.env.ATELIER_PUBLIC;
});

test("une valeur vide ne rend pas public — le piège classique du .env", () => {
  // Arrange
  process.env.ATELIER_PUBLIC = "";

  // Act & Assert — sinon une ligne `ATELIER_PUBLIC=` éteindrait l'application locale
  assert.equal(estPublic(), false);
  delete process.env.ATELIER_PUBLIC;
});

test("public et service sont deux questions distinctes", () => {
  // Arrange — la machine de développement porte les clés Clerk sans être publique
  process.env.CLERK_SECRET_KEY = "sk_test_x";
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_y";
  delete process.env.ATELIER_PUBLIC;

  // Act & Assert — sinon développer le service éteindrait l'application locale
  assert.equal(estService(), true);
  assert.equal(estPublic(), false);
});
