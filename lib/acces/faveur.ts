/**
 * Le droit d'écrire offert, et qui a le pouvoir de l'offrir.
 *
 * Deux sources de droit : un paiement constaté chez Stripe, ou une faveur de
 * l'administrateur. La seconde évite d'encaisser puis de rembourser quand on
 * veut simplement offrir l'outil.
 *
 * La liste des administrateurs vit dans l'environnement du service, pas dans
 * une métadonnée : une métadonnée se modifie depuis le tableau de bord Clerk,
 * et quiconque y a accès pourrait se sacrer lui-même. Une variable
 * d'environnement demande un accès au serveur.
 */

/** La métadonnée publique Clerk qui porte la faveur. */
export const CHAMP_FAVEUR = "orchaOffert";

export function estAdmin(courriel: unknown): boolean {
  if (typeof courriel !== "string" || !courriel.trim()) return false;

  const liste = (process.env.ATELIER_ADMIN ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  return liste.includes(courriel.trim().toLowerCase());
}

/**
 * La faveur est-elle accordée ?
 *
 * Seul le booléen exact compte. La métadonnée est publique et modifiable par
 * plusieurs chemins : accepter une chaîne « true » élargirait la porte sans
 * qu'on s'en aperçoive.
 */
export function estOffert(metadonnees: unknown): boolean {
  if (!metadonnees || typeof metadonnees !== "object") return false;
  return (metadonnees as Record<string, unknown>)[CHAMP_FAVEUR] === true;
}
