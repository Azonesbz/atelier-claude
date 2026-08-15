"use client";

import { useActionState, useState } from "react";
import {
  ajouter,
  apercuRenumerotation,
  appliquerRenumerotationAction,
  brancher,
  creer,
  debrancher,
  retirer,
  verifierRetrait,
  type Retour,
} from "./actions";

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
  numerotationATrou,
}: {
  cheminSkill: string;
  etapes: EtapeBranchable[];
  agentsDisponibles: string[];
  modifiable: boolean;
  raisonDuRefus: string;
  numerotationATrou: boolean;
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
      <RetraitEtape cheminSkill={cheminSkill} etapes={etapes} />
      {numerotationATrou && <Renumerotation cheminSkill={cheminSkill} />}
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
  const [retour, brancherAction, enCours] = useActionState(brancher, VIERGE);
  const [retourDebranche, debrancherAction, enCoursDebranche] = useActionState(debrancher, VIERGE);
  const [choisie, setChoisie] = useState(etapes[0]?.chemin ?? "");
  const etape = etapes.find((e) => e.chemin === choisie);
  const dernier = retourDebranche.etat !== "vierge" ? retourDebranche : retour;

  return (
    <Carte
      titre="Brancher un sous-agent"
      aide="Écrit dans la section « Sous-agents » de l'étape. Ta prose n'est jamais touchée, ni pour brancher ni pour retirer."
    >
      <form className="space-y-2">
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
        <div className="grid grid-cols-2 gap-2">
          <Bouton enCours={enCours} formAction={brancherAction}>
            Brancher
          </Bouton>
          <BoutonDestructif enCours={enCoursDebranche} formAction={debrancherAction}>
            Débrancher
          </BoutonDestructif>
        </div>
        <Message retour={dernier} />
      </form>
    </Carte>
  );
}

/**
 * Le retrait, en deux temps.
 *
 * Le premier montre le fichier visé et sa destination, en absolu, plus la
 * ligne du tableau qui disparaîtra. Le second écrit — et refuse si les
 * fichiers ont bougé entre-temps, grâce au jeton reposté.
 */
function RetraitEtape({ cheminSkill, etapes }: { cheminSkill: string; etapes: EtapeBranchable[] }) {
  const [apercu, verifier, enCoursVoir] = useActionState(verifierRetrait, VIERGE);
  const [ecriture, appliquer, enCoursEcrire] = useActionState(retirer, VIERGE);
  const [numero, setNumero] = useState("");
  const dernier = ecriture.etat !== "vierge" ? ecriture : apercu;
  const aConfirmer = apercu.etat === "fait" && apercu.empreinte && ecriture.etat !== "fait";

  return (
    <Carte
      titre="Retirer une étape"
      aide="La ligne quitte le tableau et le fichier part dans retirees/, à côté. Rien n'est effacé, et rien n'est écrit avant confirmation."
    >
      <div className="space-y-2">
        <form action={verifier} className="space-y-2">
          <input type="hidden" name="skill" value={cheminSkill} />
          <select
            name="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="w-full rounded border border-bord bg-carte p-2 text-sm"
          >
            <option value="" disabled>
              choisir l&apos;étape à retirer…
            </option>
            {etapes.map((e) => (
              <option key={e.chemin} value={e.numero}>
                {e.numero} · {e.role}
                {e.present ? "" : " (fichier déjà absent)"}
              </option>
            ))}
          </select>
          <Bouton enCours={enCoursVoir} libelleEnCours="Lecture…">
            Vérifier ce qui partira
          </Bouton>
        </form>

        {dernier.details && (
          <ul className="overflow-x-auto rounded border border-bord p-2 font-mono text-[10px] leading-relaxed text-attenue">
            {dernier.details.map((ligne, i) => (
              <li key={i} className="whitespace-nowrap">
                {ligne}
              </li>
            ))}
          </ul>
        )}

        <Message retour={dernier} />

        {aConfirmer && (
          <form action={appliquer}>
            <input type="hidden" name="skill" value={cheminSkill} />
            <input type="hidden" name="numero" value={numero} />
            <input type="hidden" name="empreinte" value={apercu.empreinte} />
            <BoutonDestructif enCours={enCoursEcrire}>
              Confirmer le retrait de l&apos;étape {numero}
            </BoutonDestructif>
          </form>
        )}
      </div>
    </Carte>
  );
}

/**
 * La seule action qui se montre avant de s'écrire.
 *
 * Elle touche le nom des fichiers, le tableau, les titres et tous les renvois
 * croisés : personne ne devrait lancer ça sans avoir lu ce qui va changer.
 * Deux formulaires plutôt qu'un à deux modes — un bouton porteur de
 * `formAction` ne peut pas porter de `name`, React s'en sert lui-même.
 */
function Renumerotation({ cheminSkill }: { cheminSkill: string }) {
  const [apercu, voir, enCoursVoir] = useActionState(apercuRenumerotation, VIERGE);
  const [ecriture, appliquer, enCoursEcrire] = useActionState(appliquerRenumerotationAction, VIERGE);
  const dernier = ecriture.etat !== "vierge" ? ecriture : apercu;
  const aMontrer = apercu.etat === "fait" && (apercu.details?.length ?? 0) > 0;
  const dejaEcrit = ecriture.etat === "fait";

  return (
    <Carte
      titre="Renuméroter la séquence"
      aide="Referme les trous : 00, 01, 02, 04 devient 00, 01, 02, 03. Renomme les fichiers et suit tous les renvois."
    >
      <div className="space-y-2">
        <form action={voir}>
          <input type="hidden" name="skill" value={cheminSkill} />
          <Bouton enCours={enCoursVoir} libelleEnCours="Lecture…">
            Voir ce qui changerait
          </Bouton>
        </form>

        {dernier.details && (
          <ul className="max-h-64 overflow-y-auto rounded border border-bord p-2 font-mono text-[10px] leading-relaxed text-attenue">
            {dernier.details.map((ligne, i) => (
              <li key={i} className="truncate" title={ligne}>
                {ligne}
              </li>
            ))}
          </ul>
        )}

        <Message retour={dernier} />

        {aMontrer && !dejaEcrit && (
          <form action={appliquer}>
            <input type="hidden" name="skill" value={cheminSkill} />
            <input type="hidden" name="empreinte" value={apercu.empreinte ?? ""} />
            <BoutonSecond enCours={enCoursEcrire}>Appliquer la renumérotation</BoutonSecond>
          </form>
        )}
      </div>
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

interface ProprietesBouton {
  enCours: boolean;
  children: React.ReactNode;
  formAction?: (donnees: FormData) => void;
  /** « Écriture… » par défaut ; « Lecture… » pour ce qui ne touche à rien. */
  libelleEnCours?: string;
}

function Bouton({ enCours, children, formAction, libelleEnCours }: ProprietesBouton) {
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={enCours}
      className="w-full rounded bg-encre px-3 py-1.5 text-sm font-medium text-fond disabled:opacity-40"
    >
      {enCours ? (libelleEnCours ?? "Écriture…") : children}
    </button>
  );
}

/**
 * Pour ce qui retire. Le rouge n'était jusqu'ici que la couleur des refus :
 * il devient celle des gestes qui enlèvent, pour que la règle s'apprenne.
 */
function BoutonDestructif({ enCours, children, formAction }: ProprietesBouton) {
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={enCours}
      className="w-full rounded border border-alerte/50 px-3 py-1.5 text-sm text-alerte disabled:opacity-40"
    >
      {enCours ? "Écriture…" : children}
    </button>
  );
}

/** Pour ce qui est secondaire sans rien enlever. */
function BoutonSecond({ enCours, children, formAction }: ProprietesBouton) {
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={enCours}
      className="w-full rounded border border-bord px-3 py-1.5 text-sm text-attenue disabled:opacity-40"
    >
      {enCours ? "Écriture…" : children}
    </button>
  );
}

function Message({ retour }: { retour: Retour }) {
  if (retour.etat === "vierge") return null;
  return (
    <p
      role={retour.etat === "refuse" ? "alert" : "status"}
      className={`text-xs ${retour.etat === "fait" ? "text-calme" : "text-alerte"}`}
    >
      {retour.message}
    </p>
  );
}
