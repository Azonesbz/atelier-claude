import type { NextConfig } from "next";

/**
 * Outil local : il lit et écrit le dossier .claude de la machine.
 * Rien n'est exposé au-delà de localhost, et il n'y a rien à déployer.
 */
const config: NextConfig = {
  typedRoutes: true,
  // Pas de CLAUDE.md ni d'AGENTS.md générés : les conventions vivent dans le vault.
  agentRules: false,
};

export default config;
