/**
 * La source de fichiers : le disque, ou un instantané en mémoire.
 *
 * C'est ce qui permet à l'outil de tourner dans un navigateur. Le dossier
 * `.claude` y est aspiré une fois par l'API File System Access, puis les
 * analyseurs existants — qui sont synchrones et ne connaissent que cette
 * source — travaillent dessus sans savoir d'où il vient.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { instantane, lire, listerDossier, poserSource, sourceDuDisque } from "./source.ts";

afterEach(() => poserSource(sourceDuDisque()));

const FICHIERS = {
  "/c/settings.json": '{"a":1}',
  "/c/skills/un/SKILL.md": "---\nname: un\n---\ncorps",
  "/c/skills/deux/SKILL.md": "---\nname: deux\n---\n",
  "/c/agents/a.md": "agent",
};

test("un instantané rend le contenu qu'on y a mis", () => {
  // Arrange
  poserSource(instantane(FICHIERS));

  // Act & Assert
  assert.equal(lire("/c/settings.json"), '{"a":1}');
});

test("un fichier absent vaut null, jamais une exception", () => {
  // Arrange — un settings.local.json manquant est la situation NORMALE
  poserSource(instantane(FICHIERS));

  // Act & Assert
  assert.equal(lire("/c/absent.json"), null);
});

test("lister un dossier ne rend que ses enfants directs", () => {
  // Arrange
  poserSource(instantane(FICHIERS));

  // Act
  const enfants = listerDossier("/c/skills").sort();

  // Assert — « un » et « deux », pas les SKILL.md qu'ils contiennent
  assert.deepEqual(enfants, ["deux", "un"]);
});

test("lister la racine ne remonte pas au-dessus d'elle", () => {
  // Arrange
  poserSource(instantane(FICHIERS));

  // Act & Assert
  assert.deepEqual(listerDossier("/c").sort(), ["agents", "settings.json", "skills"]);
});

test("lister un dossier inexistant rend une liste vide", () => {
  // Arrange
  poserSource(instantane(FICHIERS));

  // Act & Assert — l'interface doit afficher « rien » et non planter
  assert.deepEqual(listerDossier("/c/nexistepas"), []);
});

test("les barres finales et doublées ne changent pas le résultat", () => {
  // Arrange — les chemins viennent de `join`, mais aussi de saisies
  poserSource(instantane(FICHIERS));

  // Act & Assert
  assert.deepEqual(listerDossier("/c/skills/").sort(), ["deux", "un"]);
  assert.equal(lire("/c//settings.json"), '{"a":1}');
});

test("un dossier se distingue d'un fichier", () => {
  // Arrange
  poserSource(instantane(FICHIERS));
  const source = instantane(FICHIERS);

  // Act & Assert
  assert.equal(source.estDossier("/c/skills"), true);
  assert.equal(source.estDossier("/c/settings.json"), false);
  assert.equal(source.estDossier("/c/nexistepas"), false);
});
