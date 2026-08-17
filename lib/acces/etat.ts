/**
 * L'état d'accès, côté application locale. Le seul appel dont l'interface a besoin.
 *
 * A remplacé la clé de licence signée par le compte. Le contrat, lui, n'a pas
 * bougé — `ecritureOuverte()` reste la question unique que posent les
 * garde-fous d'écriture, et c'est ce qui a rendu la bascule sans risque.
 *
 * La décision elle-même n'est pas prise ici : elle vit dans `droit.ts`, sans
 * réseau ni disque, et c'est ce qui la rend démontrable.
 */

import { rafraichir } from "./echange.ts";
import { doitReverifier, lireReponse, tranche, type Reponse } from "./droit.ts";
import { fournisseur } from "./oauth.ts";
import { ecrireSession, lireSession, type Session } from "./session.ts";
import { adresseDuService } from "../licence/stripe.ts";

export type EtatCompte =
  | { etat: "deconnecte" }
  | { etat: "ouverte"; courriel: string | null }
  | { etat: "refusee"; courriel: string | null; raison: string };

export async function etatDAcces(): Promise<EtatCompte> {
  const session = lireSession();
  if (!session) return { etat: "deconnecte" };

  const reponse = doitReverifier(session, Date.now()) ? await demanderAuService(session) : null;
  if (reponse) enregistrer(session, reponse);

  const decide = tranche(reponse ? { ...session, droit: reponse.droit } : session, reponse);
  const courriel = session.compte.courriel;

  if (decide.etat === "ouverte") return { etat: "ouverte", courriel };
  if (decide.etat === "refusee") return { etat: "refusee", courriel, raison: decide.raison };
  return { etat: "deconnecte" };
}

/** Le seul appel dont les garde-fous d'écriture ont besoin. */
export async function ecritureOuverte(): Promise<boolean> {
  return (await etatDAcces()).etat === "ouverte";
}

/**
 * Ce que le service répond, ou `null` — et `null` couvre beaucoup de cas.
 *
 * Service non configuré, jeton de rafraîchissement absent ou mort, réseau
 * coupé, réponse illisible : tous valent « pas de nouvelle ». Aucun ne referme
 * l'écriture de quelqu'un dont le paiement a déjà été constaté.
 */
async function demanderAuService(session: Session): Promise<Reponse> {
  const f = fournisseur();
  const service = adresseDuService();
  if (!f || !service || !session.rafraichissement) return null;

  const jetons = await rafraichir(f, session.rafraichissement);
  if (!jetons) return null;

  try {
    const reponse = await fetch(`${service}/api/droit`, {
      headers: { Authorization: `Bearer ${jetons.acces}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const lue = lireReponse(await reponse.json());
    // Un rafraîchissement en chasse un autre : garder le nouveau, sinon le
    // suivant échouerait avec un jeton déjà consommé.
    if (jetons.rafraichissement) session.rafraichissement = jetons.rafraichissement;
    return lue;
  } catch {
    return null;
  }
}

function enregistrer(session: Session, reponse: NonNullable<Reponse>): void {
  ecrireSession({ ...session, droit: reponse.droit, verifieLe: Date.now() });
}
