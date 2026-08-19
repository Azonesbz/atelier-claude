/**
 * L'identifiant GitHub de l'acheteur, tel qu'il l'a saisi en payant.
 *
 * C'est la seule donnée du parcours que l'acheteur écrit lui-même, et elle
 * part ensuite dans un chemin d'API — `/repos/:proprietaire/:depot/
 * collaborators/:identifiant`. Elle est donc validée contre les règles de
 * GitHub plutôt que nettoyée : un identifiant douteux se refuse, il ne se
 * répare pas. Réparer, ce serait fabriquer un identifiant que l'acheteur n'a
 * pas écrit, et inviter quelqu'un d'autre.
 *
 * Les règles de GitHub : 39 caractères au plus, alphanumériques et tirets, ni
 * tiret au début ou à la fin, jamais deux de suite.
 */

const VALIDE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** L'acheteur colle souvent son profil entier plutôt que son pseudo. */
const PREFIXES = [/^https?:\/\/(www\.)?github\.com\//i, /^(www\.)?github\.com\//i, /^@/];

export function lireIdentifiantGithub(brut: unknown): string | null {
  if (typeof brut !== "string") return null;

  let valeur = brut.trim();
  for (const prefixe of PREFIXES) valeur = valeur.replace(prefixe, "");
  valeur = valeur.replace(/\/+$/, "");

  return VALIDE.test(valeur) ? valeur : null;
}
