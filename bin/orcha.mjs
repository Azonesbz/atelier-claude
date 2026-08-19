#!/usr/bin/env node
/**
 * Le lanceur d'Orcha — ce que `npx orcha-cli` exécute.
 *
 * Il démarre le serveur Next autonome embarqué dans le paquet, attend qu'il
 * réponde, puis ouvre le navigateur. Rien à cloner, rien à installer, rien à
 * configurer.
 *
 * L'écoute est clouée sur 127.0.0.1, et ce n'est pas un détail : aucune action
 * d'écriture n'est authentifiée. Sur 0.0.0.0, n'importe qui sur le même réseau
 * pourrait réécrire un SKILL.md de ton ~/.claude — c'est-à-dire déposer des
 * instructions que Claude Code exécuterait à la session suivante.
 */

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOTE = "127.0.0.1";
const PORT_PREFERE = 4300;

/** Un port libre, en partant du port habituel. On ne bouscule personne. */
function portLibre(depuis) {
  return new Promise((resoudre) => {
    const sonde = createServer();
    sonde.once("error", () => resoudre(portLibre(depuis + 1)));
    sonde.once("listening", () => sonde.close(() => resoudre(depuis)));
    sonde.listen(depuis, HOTE);
  });
}

async function repond(url, essais = 60) {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (r.status < 500) return true;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function ouvrirNavigateur(url) {
  const commande =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(commande, [url], { stdio: "ignore", detached: true, shell: process.platform === "win32" })
    .on("error", () => {})
    .unref();
}

const port = await portLibre(PORT_PREFERE);
const url = `http://${HOTE}:${port}`;

if (port !== PORT_PREFERE) {
  console.log(`Le port ${PORT_PREFERE} est occupé — Orcha démarre sur ${port}.`);
}

const serveur = spawn(process.execPath, [join(RACINE, "server.js")], {
  cwd: RACINE,
  stdio: ["ignore", "pipe", "inherit"],
  env: { ...process.env, HOSTNAME: HOTE, PORT: String(port), NODE_ENV: "production" },
});

serveur.stdout.on("data", () => {});
serveur.on("exit", (code) => process.exit(code ?? 0));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    serveur.kill(signal);
    process.exit(0);
  });
}

console.log("Orcha démarre…");
if (await repond(url)) {
  console.log(`\n  ${url}\n\n  Ctrl+C pour arrêter.\n`);
  ouvrirNavigateur(url);
} else {
  console.error("Le serveur n'a pas répondu. Relance avec DEBUG=1 pour voir sa sortie.");
  serveur.kill();
  process.exit(1);
}
