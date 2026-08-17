import { Deconnexion } from "./Deconnexion";
import { etatDAcces } from "@/lib/acces/etat";
import { fournisseur } from "@/lib/acces/oauth";
import { adresseDuService } from "@/lib/licence/stripe";

export const dynamic = "force-dynamic";

const RESUME = {
  deconnecte: { titre: "Lecture seule", detail: "Aucun compte connecté. Tout se lit ; modifier demande un compte et un achat.", alerte: false },
  ouverte: { titre: "Écriture ouverte", detail: "Achat vérifié.", alerte: false },
  refusee: { titre: "Lecture seule", detail: "", alerte: true },
} as const;

export default async function Compte({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const etat = await etatDAcces();
  const resume = RESUME[etat.etat];
  const service = adresseDuService();
  const connexionPossible = Boolean(fournisseur());

  return (
    <main className="max-w-2xl">
      <h1 className="font-display text-3xl">Compte</h1>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Lire ton dossier <code>.claude</code> est gratuit et le restera : le diagnostic est ce
        qu&apos;on donne. Modifier depuis l&apos;interface demande un achat, fait une fois.
      </p>

      {erreur && (
        <p role="alert" className="card mt-6 border-danger/40 bg-danger-wash p-4 text-sm text-danger">
          {erreur}
        </p>
      )}

      <section className="card mt-6 p-5">
        <span className="surtitre">État</span>
        <p className={`mt-2 text-xl font-semibold ${resume.alerte ? "text-danger" : "text-ink"}`}>
          {resume.titre}
        </p>
        <p className="mt-1 text-sm text-muted">
          {etat.etat === "refusee" ? etat.raison : resume.detail}
        </p>
        {"courriel" in etat && etat.courriel && (
          <p className="mt-1 font-mono text-xs text-muted">{etat.courriel}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {etat.etat === "deconnecte" ? (
            <a
              href="/api/auth/depart"
              className={connexionPossible ? "btn-primary" : "btn-secondary pointer-events-none opacity-45"}
            >
              Se connecter
            </a>
          ) : (
            <Deconnexion />
          )}
          {service && etat.etat !== "ouverte" && (
            <a href={`${service}/tarif`} className="btn-secondary">
              Voir l&apos;offre
            </a>
          )}
        </div>

        {!connexionPossible && (
          <p className="mt-3 text-xs text-muted">
            Aucun fournisseur d&apos;accès configuré (<code>ATELIER_ACCES_CLIENT</code>).
          </p>
        )}
      </section>

      <p className="mt-4 text-xs text-muted">
        L&apos;application tourne sur ta machine : rien de ton dossier <code>.claude</code>{" "}
        n&apos;est envoyé au service, qui ne sait qu&apos;une chose — si ton achat existe.
        {!service && (
          <>
            {" "}
            Aucun service n&apos;est configuré (<code>NEXT_PUBLIC_ATELIER_SERVICE</code>) :
            l&apos;outil reste en lecture seule.
          </>
        )}
      </p>
    </main>
  );
}
