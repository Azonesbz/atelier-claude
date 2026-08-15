import Link from "next/link";
import { Formulaire } from "./Formulaire";
import { notFound } from "next/navigation";
import { Pastille, Silences } from "@/components/primitives";
import { verifierChemin } from "@/lib/ecriture/competence";
import { ecritureOuverte } from "@/lib/licence/etat";
import { lireAtelier } from "@/lib/lecture/atelier";

export const dynamic = "force-dynamic";

export default async function Detail({ params }: { params: Promise<{ chemin: string }> }) {
  const { chemin } = await params;
  const cible = decodeURIComponent(chemin);
  const competence = lireAtelier().competences.find((c) => c.chemin === cible);
  if (!competence) notFound();

  const refus = (await ecritureOuverte())
    ? raisonDuRefus(cible)
    : "L'écriture demande un abonnement actif — la lecture reste entière. Voir la page Licence.";

  return (
    <main>
      <Link href="/" className="text-sm text-muted underline-offset-2 hover:underline">
        ← toutes les compétences
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="flex flex-wrap items-baseline gap-3 text-2xl font-semibold">
          {competence.nom}
          <Pastille portee={competence.portee} origine={competence.origine} />
          {!competence.invocableParLeModele && (
            <span className="font-mono text-xs font-normal text-muted">invisible du modèle</span>
          )}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted">{competence.chemin}</p>
        <Silences silences={competence.silences} />
      </header>

      <Formulaire
        chemin={competence.chemin}
        description={competence.description}
        indiceArgument={competence.indiceArgument}
        corps={competence.corps}
        modifiable={refus === ""}
        raisonDuRefus={refus}
      />
    </main>
  );
}

/** Chaîne vide si le fichier est modifiable, sinon la raison, en clair. */
function raisonDuRefus(chemin: string): string {
  try {
    verifierChemin(chemin);
    return "";
  } catch (erreur) {
    return erreur instanceof Error ? erreur.message : "Non modifiable.";
  }
}
