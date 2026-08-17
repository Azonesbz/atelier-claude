/**
 * La session locale : un fichier à côté de l'application, pas un cookie.
 *
 * Même raison que le choix de projet — les garde-fous d'écriture appellent la
 * même lecture, loin de toute requête, et doivent voir exactement ce que la
 * page affiche. Un cookie ne serait lisible que pendant une requête.
 *
 * Ce fichier porte le dernier verdict sur le droit d'écrire, et c'est lui qui
 * rend la garantie hors ligne possible : le jeton peut mourir, le verdict
 * reste. Voir `droit.ts`.
 */

import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Cache } from "./droit.ts";

const FICHIER = ".atelier-acces.json";

export interface Session extends Cache {
  /** Survit au redémarrage ; sert à repointer le service, jamais à tenir le droit. */
  rafraichissement: string | null;
  /** De quoi nommer la personne connectée dans l'interface. */
  compte: { id: string; courriel: string | null };
}

function chemin(): string {
  return join(process.cwd(), FICHIER);
}

/** La session, ou `null` — fichier absent, illisible, ou vidé de son compte. */
export function lireSession(): Session | null {
  try {
    const valeur = JSON.parse(readFileSync(chemin(), "utf8")) as Partial<Session>;
    return valeur.compte?.id ? (valeur as Session) : null;
  } catch {
    return null;
  }
}

/** Écriture par fichier temporaire puis renommage : jamais de session à moitié écrite. */
export function ecrireSession(session: Session): void {
  const provisoire = `${chemin()}.${process.pid}`;
  writeFileSync(provisoire, `${JSON.stringify(session, null, 2)}\n`, "utf8");
  renameSync(provisoire, chemin());
}

export function oublierSession(): void {
  try {
    unlinkSync(chemin());
  } catch {
    // Rien à oublier.
  }
}
