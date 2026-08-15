/**
 * Le résumé du tableau de bord, calculé au serveur.
 *
 * Il est produit en deux versions — avec et sans les réglages personnels — et
 * la case à cocher bascule de l'une à l'autre. C'est délibéré : compter les
 * étapes mortes d'un workflow demande de lire les fichiers d'étapes sur le
 * disque, ce qu'un composant client ne peut pas faire. Refaire ce calcul dans
 * le navigateur, c'est fabriquer une seconde vérité qui divergera.
 */

import type { Atelier, Portee } from "./types.ts";
import { aDesEtapes, lireWorkflow } from "./lecture/workflow.ts";

export interface LigneEcart {
  quoi: string;
  cause: string;
  ou: string;
  href?: string;
}

export interface Part {
  nom: string;
  compte: number;
  detail: string;
}

export interface Resume {
  ecarts: LigneEcart[];
  competences: number;
  aLaMain: number;
  workflows: number;
  etapes: number;
  arrets: number;
  agents: number;
  commandes: number;
  plugins: number;
  catalogue: number;
  permissions: number;
  deny: number;
  ask: number;
  hooks: number;
  parts: Part[];
  lus: number;
}

/**
 * @param avecPersonnel — false écarte tout ce qui vient de `~/.claude`, y
 * compris ses hooks et ses permissions. Les plugins restent : ils ont leur
 * propre tuile, et ce sont eux qui expliquent la provenance du reste.
 */
export function resumer(atelier: Atelier, avecPersonnel: boolean): Resume {
  const garde = (portee: Portee) => avecPersonnel || portee !== "utilisateur";

  const competences = atelier.competences.filter((c) => garde(c.portee));
  const agents = atelier.agents.filter((a) => garde(a.portee));
  const commandes = atelier.commandes.filter((c) => garde(c.portee));
  const hooks = atelier.hooks.filter((h) => garde(h.portee));
  const permissions = atelier.permissions.filter((r) => garde(r.portee));

  const resolveur = {
    agents: atelier.agents.map((a) => a.nom),
    competences: atelier.competences.map((c) => c.nom),
  };
  const workflows = competences
    .map((c) => ({ c, w: aDesEtapes(c.corps) ? lireWorkflow(c.chemin, c.corps, resolveur) : null }))
    .filter((x): x is { c: (typeof competences)[number]; w: NonNullable<ReturnType<typeof lireWorkflow>> } => x.w !== null);

  return {
    ecarts: [...ecartsDirects(competences, agents, commandes, atelier, hooks), ...ecartsDeWorkflow(workflows)],
    competences: competences.length,
    aLaMain: competences.filter((c) => !c.invocableParLeModele).length,
    workflows: workflows.length,
    etapes: workflows.reduce((n, { w }) => n + w.etapes.length, 0),
    arrets: workflows.reduce((n, { w }) => n + w.etapes.filter((e) => e.arretDur).length, 0),
    agents: agents.length,
    commandes: commandes.length,
    plugins: atelier.plugins.filter((p) => p.active && p.present).length,
    catalogue: atelier.catalogue.length,
    permissions: permissions.length,
    deny: permissions.filter((r) => r.decision === "deny").length,
    ask: permissions.filter((r) => r.decision === "ask").length,
    hooks: hooks.length,
    parts: repartir(atelier, avecPersonnel),
    lus: competences.length + agents.length + commandes.length,
  };
}

function ecartsDirects(
  competences: Atelier["competences"],
  agents: Atelier["agents"],
  commandes: Atelier["commandes"],
  atelier: Atelier,
  hooks: Atelier["hooks"],
): LigneEcart[] {
  return [
    ...competences.map((c) => ({ e: c, quoi: c.nom, ou: c.chemin, href: "/competences" })),
    ...agents.map((a) => ({ e: a, quoi: a.nom, ou: a.chemin, href: "/agents" })),
    ...commandes.map((c) => ({ e: c, quoi: `/${c.nom}`, ou: c.chemin, href: "/agents" })),
    ...atelier.plugins.map((p) => ({ e: p, quoi: p.identifiant, ou: p.cheminInstallation, href: "/reglages" })),
    ...hooks.map((h) => ({ e: h, quoi: h.evenement, ou: h.commande, href: "/reglages" })),
  ].flatMap(({ e, quoi, ou, href }) => e.silences.map((s) => ({ quoi, cause: s.cause, ou, href })));
}

/** Les étapes mortes : le résumé les ignorait, et pouvait dire « tout va bien ». */
function ecartsDeWorkflow(
  workflows: Array<{ c: { nom: string; chemin: string }; w: NonNullable<ReturnType<typeof lireWorkflow>> }>,
): LigneEcart[] {
  return workflows.flatMap(({ c, w }) =>
    w.etapes.flatMap((etape) =>
      etape.silences.map((s) => ({
        quoi: `${c.nom} · étape ${etape.numero}`,
        cause: s.cause,
        ou: etape.fichierDeclare,
        href: `/workflow/${encodeURIComponent(c.chemin)}`,
      })),
    ),
  );
}

/** Les portées, de la plus proche à la plus lointaine — l'ordre fait l'échelle. */
function repartir(atelier: Atelier, avecPersonnel: boolean): Part[] {
  const compter = (portee: Portee) =>
    [atelier.competences, atelier.agents, atelier.commandes].flat().filter((e) => e.portee === portee).length;

  const parts: Part[] = [
    { nom: "Ce projet", compte: compter("projet"), detail: atelier.racineProjet ?? "aucun projet lu" },
  ];
  if (avecPersonnel) {
    parts.push({ nom: "Toi", compte: compter("utilisateur"), detail: atelier.racineUtilisateur });
  }
  parts.push({
    nom: "Plugins",
    compte: compter("plugin"),
    detail: `${atelier.plugins.filter((p) => p.active).length} plugin(s) activé(s)`,
  });
  return parts;
}
