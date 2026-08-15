/**
 * Le projet qu'on regarde, quand ce n'est pas celui du dossier de lancement.
 *
 * Le choix vit dans un petit fichier à côté de l'application, pas dans un
 * cookie. Deux raisons : les garde-fous d'écriture appellent `racineProjet()`
 * en profondeur, loin de toute requête, et ils doivent voir exactement la même
 * racine que la page — un état porté par la requête les laisserait derrière.
 * Et l'outil est mono-utilisateur sur sa propre machine : une préférence de
 * machine est ce qui correspond, pas une préférence de navigateur.
 */

import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FICHIER = ".atelier-choix.json";

function cheminDuChoix(): string {
  return join(process.cwd(), FICHIER);
}

/**
 * Le projet choisi, ou null.
 *
 * Ce module n'importe rien de `lib/ecriture` : les garde-fous d'écriture
 * appellent `racineProjet()`, qui appelle ceci. Le cycle serait immédiat.
 */
export function lireChoix(): string | null {
  try {
    const valeur = JSON.parse(readFileSync(cheminDuChoix(), "utf8")) as { projet?: unknown };
    return typeof valeur.projet === "string" && valeur.projet ? valeur.projet : null;
  } catch {
    return null;
  }
}

export function ecrireChoix(projet: string): void {
  const chemin = cheminDuChoix();
  const provisoire = `${chemin}.${process.pid}`;
  writeFileSync(provisoire, `${JSON.stringify({ projet }, null, 2)}\n`, "utf8");
  renameSync(provisoire, chemin);
}

export function effacerChoix(): void {
  try {
    unlinkSync(cheminDuChoix());
  } catch {
    // Pas de choix enregistré : il n'y a rien à défaire.
  }
}
