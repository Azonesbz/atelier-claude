"use client";

import { useActionState, useState } from "react";
import { ajouter, brancher, creer, type Retour } from "./actions";

const VIERGE: Retour = { etat: "vierge", message: "" };

export interface EtapeBranchable {
  numero: string;
  role: string;
  chemin: string;
  present: boolean;
  agents: string[];
}

/** Les trois gestes d'édition, sous le plan : ajouter, brancher, créer. */
export function AtelierWorkflow({
  cheminSkill,
  etapes,
  agentsDisponibles,
  modifiable,
  raisonDuRefus,
}: {
  cheminSkill: string;
  etapes: EtapeBranchable[];
  agentsDisponibles: string[];
  modifiable: boolean;
  raisonDuRefus: string;
}) {
  if (!modifiable) {
    return (
      <p className="mt-6 rounded border border-alerte/30 bg-alerte-fond px-3 py-2 text-sm text-alerte">
        {raisonDuRefus}
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <AjoutEtape cheminSkill={cheminSkill} />
      <Branchement etapes={etapes} agents={agentsDisponibles} />
      <CreationAgent />
    </div>
  );
}

function AjoutEtape({ cheminSkill }: { cheminSkill: string }) {
  const [retour, action, enCours] = useActionState(ajouter, VIERGE);
  return (
    <Carte titre="Ajouter une étape" aide="Le fichier est créé et la ligne ajoutée au tableau. Les deux, ou rien.">
      <form action={action} className="space-y-2">
        <input type="hidden" name="skill" value={cheminSkill} />
        <Champ name="titre" placeholder="Titre de l'étape" required />
        <Champ name="sortie" placeholder="Sortie attendue" />
        <Bouton enCours={enCours}>Créer l&apos;étape</Bouton>
        <Message retour={retour} />
      </form>
    </Carte>
  );
}

function Branchement({ etapes, agents }: { etapes: EtapeBranchable[]; agents: string[] }) {
  const [retour, action, enCours] = useActionState(brancher, VIERGE);
  const [choisie, setChoisie] = useState(etapes[0]?.chemin ?? "");
  const etape = etapes.find((e) => e.chemin === choisie);

  return (
    <Carte titre="Brancher un sous-agent" aide="Ajouté à la section « Sous-agents » de l'étape. Ta prose n'est jamais touchée.">
      <form action={action} className="space-y-2">
        <select
          name="etape"
          value={choisie}
          onChange={(e) => setChoisie(e.target.value)}
          className="w-full rounded border border-bord bg-carte p-2 text-sm"
        >
          {etapes.map((e) => (
            <option key={e.chemin} value={e.chemin} disabled={!e.present}>
              {e.numero} · {e.role}
              {e.present ? "" : " (fichier absent)"}
            </option>
          ))}
        </select>
        <select name="agent" className="w-full rounded border border-bord bg-carte p-2 font-mono text-sm">
          {agents.map((nom) => (
            <option key={nom} value={nom}>
              {nom}
              {etape?.agents.includes(nom) ? " — déjà branché" : ""}
            </option>
          ))}
        </select>
        <Bouton enCours={enCours}>Brancher</Bouton>
        <Message retour={retour} />
      </form>
    </Carte>
  );
}

function CreationAgent() {
  const [retour, action, enCours] = useActionState(creer, VIERGE);
  return (
    <Carte titre="Créer un sous-agent" aide="Écrit agents/<nom>.md. La description décide s'il sera choisi — soigne-la.">
      <form action={action} className="space-y-2">
        <Champ name="nom" placeholder="nom-en-minuscules" required />
        <textarea
          name="description"
          rows={2}
          required
          placeholder="Quand déléguer à cet agent, et pour quoi faire"
          className="w-full rounded border border-bord bg-carte p-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Champ name="outils" placeholder="tools (facultatif)" />
          <Champ name="modele" placeholder="model (facultatif)" />
        </div>
        <select name="portee" className="w-full rounded border border-bord bg-carte p-2 text-sm">
          <option value="utilisateur">portée utilisateur (~/.claude)</option>
          <option value="projet">portée projet (.claude du projet)</option>
        </select>
        <Bouton enCours={enCours}>Créer l&apos;agent</Bouton>
        <Message retour={retour} />
      </form>
    </Carte>
  );
}

function Carte({ titre, aide, children }: { titre: string; aide: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-bord bg-carte p-4">
      <h3 className="text-sm font-semibold">{titre}</h3>
      <p className="mb-3 text-xs text-attenue">{aide}</p>
      {children}
    </section>
  );
}

function Champ(proprietes: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...proprietes} className="w-full rounded border border-bord bg-carte p-2 text-sm" />;
}

function Bouton({ enCours, children }: { enCours: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={enCours}
      className="w-full rounded bg-encre px-3 py-1.5 text-sm font-medium text-fond disabled:opacity-40"
    >
      {enCours ? "Écriture…" : children}
    </button>
  );
}

function Message({ retour }: { retour: Retour }) {
  if (retour.etat === "vierge") return null;
  return (
    <p className={`text-xs ${retour.etat === "fait" ? "text-calme" : "text-alerte"}`}>{retour.message}</p>
  );
}
