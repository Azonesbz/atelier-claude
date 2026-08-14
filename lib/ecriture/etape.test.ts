/**
 * L'ajout d'une étape : le fichier et le tableau, ou rien.
 *
 * Le test qui compte est celui du retour en arrière : écrire le fichier sans
 * réussir à modifier le tableau fabriquerait un orphelin, c'est-à-dire
 * exactement l'écart que cet outil sert à signaler.
 */

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ajouterEtape, conventionDe, retirerEtape } from "./etape.ts";
import type { EtapeWorkflow, Workflow } from "../lecture/workflow.ts";

function etape(numero: string, fichier: string): EtapeWorkflow {
  return {
    numero, role: `Rôle ${numero}`, fichierDeclare: fichier,
    cheminAbsolu: `/x/${fichier}`, present: true, lignes: 10,
    agents: [], competences: [], arretDur: false, suivanteConfirmee: false, silences: [],
  };
}

function atelierJetable(dossier: string, prefixe: string) {
  const racine = mkdtempSync(join(tmpdir(), "etape-"));
  process.env.CLAUDE_CONFIG_DIR = racine;
  process.env.ATELIER_PROJET = racine;
  const skill = join(racine, "skills", "essai");
  mkdirSync(join(skill, dossier), { recursive: true });
  writeFileSync(
    join(skill, "SKILL.md"),
    [
      "---", "name: essai", "description: Un essai.", "---", "",
      "## Séquence", "",
      "| # | Étape | Sortie |", "|---|---|---|",
      `| 00 | \`${dossier}/${prefixe}-00-depart.md\` | Départ |`,
      `| 01 | \`${dossier}/${prefixe}-01-suite.md\` | Suite |`,
      "", "## Après", "", "Du texte qui ne doit pas bouger.", "",
    ].join("\n"),
    "utf8",
  );
  const workflow: Workflow = {
    etapes: [etape("00", `${dossier}/${prefixe}-00-depart.md`), etape("01", `${dossier}/${prefixe}-01-suite.md`)],
    orphelins: [], depart: null,
  };
  workflow.etapes.forEach((e) => { e.cheminAbsolu = join(skill, e.fichierDeclare); });
  return { racine, skill: join(skill, "SKILL.md"), workflow };
}

test("la convention est déduite du workflow, pas imposée", () => {
  // Arrange
  const halo: Workflow = { etapes: [etape("00", "steps/step-00-init.md")], orphelins: [], depart: null };
  const lancer: Workflow = { etapes: [etape("00", "etapes/etape-00-reco.md")], orphelins: [], depart: null };

  // Act & Assert
  assert.deepEqual(conventionDe(halo), { dossier: "steps", prefixe: "step", largeur: 2, prochainNumero: "01" });
  assert.deepEqual(conventionDe(lancer), { dossier: "etapes", prefixe: "etape", largeur: 2, prochainNumero: "01" });
});

test("l'étape est écrite ET la ligne ajoutée au tableau", () => {
  // Arrange
  const { skill, workflow } = atelierJetable("etapes", "etape");

  // Act
  const ecrit = ajouterEtape(skill, workflow, { titre: "Le grand ménage", sortieAttendue: "Tout est rangé" });

  // Assert
  assert.ok(existsSync(ecrit));
  assert.ok(ecrit.endsWith("etapes/etape-02-le-grand-menage.md"));
  const table = readFileSync(skill, "utf8");
  assert.ok(table.includes("| 02 | `etapes/etape-02-le-grand-menage.md` | Tout est rangé |"));
  assert.ok(readFileSync(ecrit, "utf8").startsWith("# Étape 02 — Le grand ménage"));
});

test("le reste du SKILL.md ne bouge pas", () => {
  // Arrange
  const { skill, workflow } = atelierJetable("etapes", "etape");
  const avant = readFileSync(skill, "utf8");

  // Act
  ajouterEtape(skill, workflow, { titre: "Ajout", sortieAttendue: "Rien" });

  // Assert
  const apres = readFileSync(skill, "utf8");
  assert.ok(apres.includes("Du texte qui ne doit pas bouger."));
  assert.equal(apres.split("\n").length, avant.split("\n").length + 1, "une seule ligne en plus");
});

test("sans tableau d'étapes, rien n'est écrit du tout", () => {
  // Arrange
  const { racine, workflow } = atelierJetable("etapes", "etape");
  const orphelin = join(racine, "skills", "sansTable", "SKILL.md");
  mkdirSync(join(racine, "skills", "sansTable", "etapes"), { recursive: true });
  writeFileSync(orphelin, "---\nname: x\n---\n\nPas de tableau.\n", "utf8");

  // Act & Assert
  assert.throws(() => ajouterEtape(orphelin, workflow, { titre: "Perdue", sortieAttendue: "" }), /tableau/i);
  assert.equal(existsSync(join(racine, "skills", "sansTable", "etapes", "etape-02-perdue.md")), false,
    "le fichier d'étape doit avoir été retiré");
});

test("un titre qui ne donne aucun nom de fichier est refusé", () => {
  // Arrange
  const { skill, workflow } = atelierJetable("etapes", "etape");

  // Act & Assert
  assert.throws(() => ajouterEtape(skill, workflow, { titre: "!!!", sortieAttendue: "x" }), /nom de fichier/i);
});

test("retirer une étape sort la ligne du tableau et le fichier de la séquence", () => {
  // Arrange
  const { racine, skill, workflow } = atelierJetable("etapes", "etape");
  const fichier = join(racine, "skills", "essai", "etapes", "etape-01-suite.md");
  writeFileSync(fichier, "# Étape 01\n", "utf8");
  workflow.etapes[1].cheminAbsolu = fichier;

  // Act
  const destination = retirerEtape(skill, workflow, "01");

  // Assert
  assert.equal(existsSync(fichier), false, "le fichier quitte le dossier d'étapes");
  assert.ok(destination?.endsWith("retirees/etape-01-suite.md"));
  assert.ok(existsSync(destination), "il est déplacé, pas effacé");
  const table = readFileSync(skill, "utf8");
  assert.ok(!table.includes("etape-01-suite.md"));
  assert.ok(table.includes("etape-00-depart.md"), "les autres lignes restent");
});

test("retirer laisse le reste du SKILL.md intact", () => {
  // Arrange
  const { racine, skill, workflow } = atelierJetable("etapes", "etape");
  const fichier = join(racine, "skills", "essai", "etapes", "etape-01-suite.md");
  writeFileSync(fichier, "# Étape 01\n", "utf8");
  workflow.etapes[1].cheminAbsolu = fichier;

  // Act
  retirerEtape(skill, workflow, "01");

  // Assert
  assert.ok(readFileSync(skill, "utf8").includes("Du texte qui ne doit pas bouger."));
});

test("retirer une étape dont le fichier manque déjà nettoie seulement le tableau", () => {
  // Arrange — l'étape 01 est déclarée mais absente du disque
  const { skill, workflow } = atelierJetable("etapes", "etape");
  workflow.etapes[1].present = false;

  // Act
  const destination = retirerEtape(skill, workflow, "01");

  // Assert
  assert.equal(destination, null);
  assert.ok(!readFileSync(skill, "utf8").includes("etape-01-suite.md"));
});

test("retirer une étape inconnue est refusé", () => {
  // Arrange
  const { skill, workflow } = atelierJetable("etapes", "etape");

  // Act & Assert
  assert.throws(() => retirerEtape(skill, workflow, "99"), /Aucune étape 99/);
});
