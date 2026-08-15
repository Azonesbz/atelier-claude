import { FormulaireLicence } from "./Formulaire";
import { etatDeLaLicence } from "@/lib/licence/etat";
import { adresseDuService } from "@/lib/licence/stripe";

export const dynamic = "force-dynamic";

const RESUME: Record<string, { titre: string; detail: string; alerte: boolean }> = {
  absente: {
    titre: "Lecture seule",
    detail: "Aucune clé enregistrée. Tout se lit ; l'écriture demande la licence.",
    alerte: false,
  },
  active: { titre: "Écriture ouverte", detail: "Abonnement actif.", alerte: false },
  "hors-ligne": {
    titre: "Écriture ouverte",
    detail: "Le service n'a pas répondu, mais la dernière vérification était bonne.",
    alerte: false,
  },
  refusee: { titre: "Lecture seule", detail: "", alerte: true },
};

export default async function Licence() {
  const etat = await etatDeLaLicence();
  const resume = RESUME[etat.etat];
  const service = adresseDuService();

  return (
    <main className="max-w-2xl">
      <h1 className="font-display text-3xl">Licence</h1>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Lire ton dossier <code>.claude</code> est gratuit et le restera : le diagnostic est ce
        qu&apos;on donne. Modifier depuis l&apos;interface demande la licence, achetée une fois.
      </p>

      <section className="card mt-6 p-5">
        <span className="surtitre">État</span>
        <p className={`mt-2 text-xl font-semibold ${resume.alerte ? "text-danger" : "text-ink"}`}>
          {resume.titre}
        </p>
        <p className="mt-1 text-sm text-muted">
          {etat.etat === "refusee" ? etat.raison : resume.detail}
          {etat.etat === "active" && etat.jusquau
            ? ` Achetée le ${new Date(etat.jusquau).toLocaleDateString("fr-FR")}.`
            : ""}
        </p>

        <FormulaireLicence cle={"cle" in etat ? etat.cle : ""} />
      </section>

      <p className="mt-4 text-xs text-muted">
        {service ? (
          <>
            Pas encore de licence ?{" "}
            <a href={`${service}/tarif`} className="underline underline-offset-4">
              voir l&apos;offre
            </a>
            . L&apos;application tourne sur ta machine : rien de ton dossier
            <code> .claude</code> n&apos;est envoyé au service, qui ne sait qu&apos;une chose —
            si ton achat existe.
          </>
        ) : (
          <>
            Aucun service de licence n&apos;est configuré (<code>NEXT_PUBLIC_ATELIER_SERVICE</code>
            ). L&apos;outil reste en lecture seule.
          </>
        )}
      </p>
    </main>
  );
}
