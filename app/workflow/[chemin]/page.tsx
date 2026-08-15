import Link from "next/link";
import { notFound } from "next/navigation";
import { PlanWorkflow } from "@/components/PlanWorkflow";
import { AtelierWorkflow } from "./Atelier";
import { Pastille } from "@/components/primitives";
import { verifierChemin } from "@/lib/ecriture/competence";
import { EcritureRefusee } from "@/lib/ecriture/garde";
import { ecritureOuverte } from "@/lib/licence/etat";
import { lireAtelier } from "@/lib/lecture/atelier";
import { lireWorkflow } from "@/lib/lecture/workflow";

export const dynamic = "force-dynamic";

export default async function VueWorkflow({ params }: { params: Promise<{ chemin: string }> }) {
  const { chemin } = await params;
  const cible = decodeURIComponent(chemin);

  const atelier = lireAtelier();
  const competence = atelier.competences.find((c) => c.chemin === cible);
  if (!competence) notFound();

  const workflow = lireWorkflow(competence.chemin, competence.corps, {
    agents: atelier.agents.map((a) => a.nom),
    competences: atelier.competences.map((c) => c.nom),
  });
  if (!workflow) notFound();

  const manquantes = workflow.etapes.filter((e) => !e.present).length;
  const arrets = workflow.etapes.filter((e) => e.arretDur).length;
  const refus = (await ecritureOuverte())
    ? raisonDuRefus(competence.chemin)
    : "L'écriture demande la licence — la lecture reste entière. Voir la page Licence.";
  // Un trou dans la numérotation : 00, 01, 03 — l'étape 02 a été retirée.
  const numerotationATrou = workflow.etapes.some((e, i) => Number(e.numero) !== i);

  return (
    <main>
      <Link href="/" className="text-sm text-muted underline-offset-2 hover:underline">
        ← toutes les compétences
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="flex flex-wrap items-baseline gap-3 text-2xl font-semibold">
          {competence.nom}
          <Pastille portee={competence.portee} origine={competence.origine} />
        </h1>
        <p className="mt-2 text-sm text-muted">
          {workflow.etapes.length} étapes · {arrets} arrêt{arrets > 1 ? "s" : ""} dur
          {arrets > 1 ? "s" : ""} ·{" "}
          {workflow.depart
            ? `entrée déclarée à l'étape ${workflow.depart}`
            : "entrée non déclarée, la première du tableau fait foi"}
          {manquantes > 0 && (
            <span className="text-danger"> · {manquantes} fichier(s) d&apos;étape absent(s)</span>
          )}
        </p>
        <Link
          href={`/competence/${encodeURIComponent(competence.chemin)}`}
          className="mt-1 inline-block text-sm underline underline-offset-2"
        >
          modifier la compétence
        </Link>
      </header>

      <PlanWorkflow workflow={workflow} />

      <AtelierWorkflow
        cheminSkill={competence.chemin}
        etapes={workflow.etapes.map((e) => ({
          numero: e.numero,
          role: e.role,
          chemin: e.cheminAbsolu,
          present: e.present,
          agents: e.agents,
        }))}
        agentsDisponibles={[...new Set(atelier.agents.map((a) => a.nom))].sort()}
        modifiable={refus === ""}
        raisonDuRefus={refus}
        numerotationATrou={numerotationATrou}
      />

      <p className="mt-6 font-mono text-[11px] text-muted">
        trait plein : l&apos;étape nomme elle-même la suivante · trait pointillé : ordre du
        tableau seulement
      </p>

      {workflow.orphelins.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            Fichiers hors séquence
          </h2>
          <p className="mb-2 text-sm text-muted">
            Présents dans le dossier d&apos;étapes, absents du tableau : jamais lus.
          </p>
          <ul className="rounded-lg border border-line bg-surface px-4">
            {workflow.orphelins.map((chemin) => (
              <li key={chemin} className="border-b border-line py-2 font-mono text-xs last:border-0">
                {chemin}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

/** Chaîne vide si ce workflow est modifiable, sinon la raison, en clair. */
function raisonDuRefus(cheminSkill: string): string {
  try {
    verifierChemin(cheminSkill);
    return "";
  } catch (erreur) {
    return erreur instanceof EcritureRefusee ? erreur.message : "Non modifiable.";
  }
}
