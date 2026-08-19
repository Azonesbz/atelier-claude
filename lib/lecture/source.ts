/**
 * D'où viennent les fichiers : le disque, ou un instantané en mémoire.
 *
 * C'est cette indirection qui permet à l'outil de tourner **dans un
 * navigateur**. Le dossier `.claude` y est aspiré une fois par l'API File
 * System Access, puis les analyseurs existants travaillent dessus sans savoir
 * d'où il vient — ils sont synchrones, et l'instantané l'est aussi.
 *
 * L'alternative aurait été de rendre toute la couche de lecture asynchrone :
 * mille cinq cents lignes touchées pour un dossier qui tient en mémoire. Un
 * `.claude` complet pèse quelques centaines de kilo-octets.
 *
 * Aucune fonction ne lève : un fichier absent est une situation normale.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";

export interface Source {
  lire(chemin: string): string | null;
  listerDossier(chemin: string): string[];
  estDossier(chemin: string): boolean;
}

/** Les chemins viennent de `join` mais aussi de saisies : on normalise. */
function propre(chemin: string): string {
  return chemin.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
}

/** Le disque. C'est la source par défaut, celle du rôle local. */
export function sourceDuDisque(): Source {
  return {
    lire(chemin) {
      try {
        return readFileSync(chemin, "utf8");
      } catch {
        return null;
      }
    },
    listerDossier(chemin) {
      try {
        return readdirSync(chemin);
      } catch {
        return [];
      }
    },
    estDossier(chemin) {
      try {
        return statSync(chemin).isDirectory();
      } catch {
        return false;
      }
    },
  };
}

/** Un instantané : le dossier aspiré une fois, puis lu autant qu'on veut. */
export function instantane(fichiers: Record<string, string>): Source {
  const carte = new Map(Object.entries(fichiers).map(([c, v]) => [propre(c), v]));

  const dossiers = new Set<string>();
  for (const chemin of carte.keys()) {
    const morceaux = chemin.split("/");
    for (let i = 1; i < morceaux.length; i++) dossiers.add(morceaux.slice(0, i).join("/") || "/");
  }

  return {
    lire: (chemin) => carte.get(propre(chemin)) ?? null,
    estDossier: (chemin) => dossiers.has(propre(chemin)),
    listerDossier(chemin) {
      const base = propre(chemin);
      const prefixe = base === "/" ? "/" : `${base}/`;
      const enfants = new Set<string>();

      for (const cle of [...carte.keys(), ...dossiers]) {
        if (!cle.startsWith(prefixe) || cle === base) continue;
        const reste = cle.slice(prefixe.length);
        if (reste) enfants.add(reste.split("/")[0]);
      }
      return [...enfants];
    },
  };
}

let courante: Source = sourceDuDisque();

export function poserSource(source: Source): void {
  courante = source;
}

export const lire = (chemin: string) => courante.lire(chemin);
export const listerDossier = (chemin: string) => courante.listerDossier(chemin);
export const estDossierSource = (chemin: string) => courante.estDossier(chemin);
