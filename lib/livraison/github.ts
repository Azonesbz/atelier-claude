/**
 * L'invitation au dépôt privé, une fois le paiement acquitté.
 *
 * C'est ce qui rend la vente cohérente : sans elle, un acheteur repart avec un
 * droit d'écriture sur un outil qu'il ne peut pas installer.
 *
 * L'appel est **idempotent** côté GitHub — réinviter quelqu'un déjà invité ne
 * produit pas d'erreur. C'est ce qui permet de rejouer un webhook sans risque,
 * et Stripe en rejoue.
 */

/** Lecture seule : l'acheteur reçoit le code, il ne pousse pas dedans. */
const DROIT = "pull";

export interface Invitation {
  ok: boolean;
  detail: string;
}

function depot(): { proprietaire: string; nom: string; jeton: string } | null {
  const jeton = process.env.GITHUB_TOKEN;
  const complet = process.env.GITHUB_DEPOT;
  if (!jeton || !complet) return null;

  const [proprietaire, nom] = complet.split("/");
  return proprietaire && nom ? { proprietaire, nom, jeton } : null;
}

/**
 * Invite l'identifiant au dépôt. Ne lève jamais : un échec doit être rapporté
 * et réparable, pas faire échouer la réponse au webhook — Stripe rejouerait.
 */
export async function inviterAuDepot(identifiant: string): Promise<Invitation> {
  const d = depot();
  if (!d) return { ok: false, detail: "GITHUB_TOKEN ou GITHUB_DEPOT absent du service." };

  try {
    const reponse = await fetch(
      `https://api.github.com/repos/${d.proprietaire}/${d.nom}/collaborators/${identifiant}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${d.jeton}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ permission: DROIT }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    // 201 : invitation créée. 204 : déjà collaborateur, donc déjà servi.
    if (reponse.status === 201) return { ok: true, detail: `Invitation envoyée à ${identifiant}.` };
    if (reponse.status === 204) return { ok: true, detail: `${identifiant} avait déjà l'accès.` };

    const corps = (await reponse.json().catch(() => ({}))) as { message?: string };
    return { ok: false, detail: `GitHub a refusé (${reponse.status}) : ${corps.message ?? "sans motif"}` };
  } catch {
    return { ok: false, detail: "GitHub injoignable." };
  }
}
