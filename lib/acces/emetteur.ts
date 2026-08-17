/**
 * L'émetteur OIDC, déduit de la clé publiable Clerk.
 *
 * Une clé publiable vaut `pk_test_` ou `pk_live_` suivi de l'URL de l'API
 * frontale en base64, terminée par un `$` qui sert de butée — c'est ce qui
 * permet de détecter une clé tronquée. Rien n'y est secret : elle part dans
 * chaque page, donc elle peut voyager avec le produit.
 *
 * En déduire l'émetteur épargne une variable à remplir, et surtout épargne la
 * faute où les deux ne désignent pas la même instance.
 */

const PREFIXES = ["pk_test_", "pk_live_"];
/** Un nom d'hôte, et rien d'autre : pas de barre, pas de port, pas de schéma. */
const HOTE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/**
 * L'émetteur, ou `null` si la clé n'en est pas une.
 *
 * Ne lève jamais : cette valeur vient d'un fichier rempli à la main, donc elle
 * sera fausse un jour. Une clé secrète collée par erreur doit valoir `null`
 * comme le reste — jamais servir d'émetteur.
 */
export function emetteurDepuisClePubliable(cle: string): string | null {
  const prefixe = PREFIXES.find((p) => cle.startsWith(p));
  if (!prefixe) return null;

  const decodee = Buffer.from(cle.slice(prefixe.length), "base64").toString("utf8");
  if (!decodee.endsWith("$")) return null;

  const hote = decodee.slice(0, -1);
  return HOTE.test(hote) ? `https://${hote}` : null;
}
