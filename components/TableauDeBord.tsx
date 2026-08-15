"use client";

import { useState } from "react";
import { Ecarts, RepartitionPortee, Tuile } from "@/components/tableau-de-bord";
import type { Resume } from "@/lib/resume";

/**
 * Le tableau de bord, avec ou sans les réglages personnels.
 *
 * Les deux résumés sont calculés au serveur et passés ensemble : compter les
 * étapes mortes d'un workflow demande de lire le disque, et refaire ce calcul
 * ici fabriquerait une seconde vérité.
 */
export function TableauDeBord({
  avec,
  sans,
  racineUtilisateur,
  veilleInstallee,
}: {
  avec: Resume;
  sans: Resume;
  racineUtilisateur: string;
  veilleInstallee: boolean;
}) {
  const [inclurePersonnel, setInclurePersonnel] = useState(true);
  const r = inclurePersonnel ? avec : sans;

  return (
    <>
      <label className="mb-4 flex w-fit items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={inclurePersonnel}
          onChange={(e) => setInclurePersonnel(e.target.checked)}
          className="h-4 w-4"
        />
        <span>
          inclure les réglages personnels
          <span className="ml-2 font-mono text-[11px] text-muted">{racineUtilisateur}</span>
        </span>
      </label>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile
          titre="Sans effet"
          valeur={r.ecarts.length}
          precision={r.ecarts.length === 0 ? "rien à corriger" : "détail ci-dessous"}
          alerte={r.ecarts.length > 0}
        />
        <Tuile
          titre="Compétences"
          valeur={r.competences}
          precision={`dont ${r.aLaMain} lancées à la main`}
          href="/competences"
        />
        <Tuile
          titre="Workflows"
          valeur={r.workflows}
          precision={`${r.etapes} étapes, ${r.arrets} arrêts durs`}
          href="/workflows"
        />
        <Tuile
          titre="Agents et commandes"
          valeur={r.agents + r.commandes}
          precision={`${r.agents} agents · ${r.commandes} commandes`}
          href="/agents"
        />
        <Tuile
          titre="Plugins actifs"
          valeur={r.plugins}
          precision={`${r.catalogue} au catalogue, non activés`}
          href="/reglages"
        />
        <Tuile
          titre="Permissions"
          valeur={r.permissions}
          precision={`${r.deny} deny · ${r.ask} ask`}
          href="/reglages"
        />
        <Tuile titre="Hooks" valeur={r.hooks} precision="lancés automatiquement" href="/reglages" />
        <Tuile
          titre="Veille"
          valeur={veilleInstallee ? "en place" : "absente"}
          precision={veilleInstallee ? "prévient au démarrage" : "à installer"}
          href="/veille"
          alerte={!veilleInstallee}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Ecarts lignes={r.ecarts} />
        <RepartitionPortee parts={r.parts} />
      </div>
    </>
  );
}
