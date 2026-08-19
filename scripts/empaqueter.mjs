#!/usr/bin/env node
/**
 * Assemble le paquet npm publiable, à partir du build autonome.
 *
 * Ce qui part sur npm est **le rôle local uniquement**. Aucun secret n'y entre :
 * les seules valeurs inscrites au paquet sont publiques par construction — la
 * clé publiable Clerk part dans chaque page, et l'identifiant OAuth est celui
 * d'un client public, que PKCE protège précisément parce qu'il est distribué.
 *
 * CLERK_SECRET_KEY, STRIPE_SECRET_KEY et GITHUB_TOKEN restent au service. Sans
 * elles, `estService()` est faux : ni ClerkProvider, ni middleware, ni page de
 * vente dans le paquet.
 */

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/* Next trace TOUT le projet dans le build autonome — `lib/lecture/reglages.ts`
   lit des chemins dynamiques, et l'analyse statique renonce. Le .env.production
   s'y retrouve donc, avec les clés live. Purger n'est pas une précaution de
   confort : sans ça, `npm publish` diffuse les secrets du service. */
const INTERDITS = [
  /^\.env/, /\.test\.[tj]s$/, /^\.git$/, /^\.claude$/, /^\.atelier-/,
  /^__pycache__$/, /\.py$/,
  // Les sources ne sont pas exécutées — le serveur autonome tourne sur les
  // chunks compilés. Les garder alourdit le paquet et laisse croire qu'on
  // distribue le dépôt.
  /^docs$/, /^scripts$/, /^atelier-claude$/, /^deployer\.sh$/, /^compose\.yaml$/,
  /^Dockerfile$/, /^proxy\.ts$/, /^next-env\.d\.ts$/, /^tsconfig\.json$/,
  /^postcss\.config\.mjs$/, /^next\.config\.ts$/,
];

function purger(dossier) {
  let retires = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (INTERDITS.some((motif) => motif.test(nom))) {
      rmSync(chemin, { recursive: true, force: true });
      retires.push(chemin);
      continue;
    }
    if (statSync(chemin).isDirectory() && nom !== "node_modules") {
      retires = retires.concat(purger(chemin));
    }
  }
  return retires;
}

const RACINE = process.cwd();
const SORTIE = join(RACINE, "paquet");
const app = JSON.parse(readFileSync(join(RACINE, "package.json"), "utf8"));

rmSync(SORTIE, { recursive: true, force: true });
mkdirSync(SORTIE, { recursive: true });

// Le serveur autonome et ses ressources.
cpSync(join(RACINE, ".next/standalone"), SORTIE, { recursive: true });
cpSync(join(RACINE, ".next/static"), join(SORTIE, ".next/static"), { recursive: true });
cpSync(join(RACINE, "public"), join(SORTIE, "public"), { recursive: true });
mkdirSync(join(SORTIE, "bin"), { recursive: true });
cpSync(join(RACINE, "bin/orcha.mjs"), join(SORTIE, "bin/orcha.mjs"));

// Un manifeste propre : ni scripts de développement, ni dépendances — le
// serveur autonome embarque déjà ce dont il a besoin.
writeFileSync(
  join(SORTIE, "package.json"),
  `${JSON.stringify(
    {
      name: "orcha-cli",
      version: app.version,
      description: "Voir ce que ton dossier .claude déclare, et ce qui charge vraiment.",
      bin: { orcha: "bin/orcha.mjs" },
      // Surtout PAS `type: module` : le server.js de Next est en CommonJS et
      // refuserait de démarrer. Le lanceur est en .mjs, il s'en passe.
      license: "SEE LICENSE IN README.md",
      engines: { node: ">=20" },
      keywords: ["claude", "claude-code", "skills", "agents", "diagnostic"],
      homepage: "https://orcha.vincentavz.com",
      author: "Vincent Avez <vincent.avez22@gmail.com>",
    },
    null,
    2,
  )}\n`,
);

const retires = purger(SORTIE);
if (retires.length) {
  console.log(`Purgé ${retires.length} fichier(s) qui n'ont rien à faire sur npm :`);
  for (const c of retires.slice(0, 8)) console.log(`  ${c.replace(SORTIE, "paquet")}`);
}

cpSync(join(RACINE, "README.md"), join(SORTIE, "README.md"));
console.log(`Paquet assemblé dans ${SORTIE}`);
console.log("Vérifie avec :  npm pack --dry-run --prefix paquet");
console.log("Publie avec  :  npm publish --access public --prefix paquet");
