/**
 * La mise en plan : des positions, et rien d'aléatoire.
 *
 * Un plan qui bouge d'un rendu à l'autre est illisible. Ces tests vérifient
 * surtout que le calcul est stable et qu'un appelé partagé reste unique.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { mettreEnPlan } from "./plan.ts";
import type { EtapeWorkflow, Workflow } from "./lecture/workflow.ts";

function etape(numero: string, agents: string[] = [], suivanteConfirmee = true): EtapeWorkflow {
  return {
    numero,
    role: `Rôle ${numero}`,
    fichierDeclare: `steps/step-${numero}.md`,
    cheminAbsolu: `/x/steps/step-${numero}.md`,
    present: true,
    lignes: 20,
    agents,
    competences: [],
    arretDur: false,
    suivanteConfirmee,
    silences: [],
  };
}

function workflow(etapes: EtapeWorkflow[], depart: string | null = null): Workflow {
  return { etapes, orphelins: [], depart };
}

test("les étapes s'empilent dans l'ordre, sans chevauchement", () => {
  // Arrange
  const donnees = workflow([etape("00"), etape("01"), etape("02")]);

  // Act
  const plan = mettreEnPlan(donnees);

  // Assert
  const ys = plan.blocs.map((b) => b.y);
  assert.deepEqual(ys, [...ys].sort((a, b) => a - b));
  assert.ok(ys[1] - ys[0] > 0);
});

test("le point de départ suit la déclaration du SKILL.md, pas l'ordre", () => {
  // Arrange — l'entrée déclarée est l'étape 02, pas la première du tableau
  const donnees = workflow([etape("00"), etape("01"), etape("02")], "02");

  // Act
  const plan = mettreEnPlan(donnees);

  // Assert
  assert.deepEqual(plan.blocs.map((b) => b.depart), [false, false, true]);
});

test("faute de déclaration, la première étape est le départ", () => {
  // Arrange
  const donnees = workflow([etape("00"), etape("01")]);

  // Act
  const plan = mettreEnPlan(donnees);

  // Assert
  assert.equal(plan.blocs[0].depart, true);
  assert.equal(plan.blocs[1].depart, false);
});

test("un agent appelé par trois étapes n'apparaît qu'une fois", () => {
  // Arrange
  const donnees = workflow([
    etape("00", ["test-runner"]),
    etape("01", ["test-runner"]),
    etape("02", ["test-runner"]),
  ]);

  // Act
  const plan = mettreEnPlan(donnees);

  // Assert
  assert.equal(plan.satellites.length, 1, "un seul bloc pour l'agent partagé");
  assert.equal(plan.liens.filter((l) => l.sorte === "appel").length, 3, "trois liens vers lui");
});

test("une transition non confirmée par l'étape est marquée comme telle", () => {
  // Arrange — l'étape 00 ne nomme pas sa suivante, l'étape 01 si
  const donnees = workflow([etape("00", [], false), etape("01", [], true), etape("02")]);

  // Act
  const plan = mettreEnPlan(donnees);

  // Assert
  const sequence = plan.liens.filter((l) => l.sorte === "sequence");
  assert.deepEqual(sequence.map((l) => l.confirme), [false, true]);
});

test("deux mises en plan des mêmes données donnent le même résultat", () => {
  // Arrange
  const donnees = workflow([etape("00", ["a"]), etape("01", ["b"]), etape("02", ["a"])]);

  // Act
  const premier = mettreEnPlan(donnees);
  const second = mettreEnPlan(donnees);

  // Assert
  assert.deepEqual(premier.satellites, second.satellites);
  assert.deepEqual(premier.blocs.map((b) => b.y), second.blocs.map((b) => b.y));
});
