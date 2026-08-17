/**
 * Les seuls cookies de l'application : ceux du parcours d'autorisation.
 *
 * Ils portent le vérifieur et l'état entre le départ et le retour, et rien
 * d'autre. Le droit d'écrire, lui, vit dans un fichier à côté de
 * l'application — comme le choix de projet, et pour la même raison : les
 * garde-fous d'écriture le lisent loin de toute requête.
 *
 * Pas de `Secure` : l'application est servie en clair sur `127.0.0.1`, et
 * l'attribut y empêcherait le cookie d'être posé. Le loopback n'est pas un
 * réseau — rien ne transite.
 */

export const DEPART = {
  verifieur: "atelier_verifieur",
  etat: "atelier_etat",
} as const;

/** Un aller-retour vers une page de connexion, pas une session. */
const DUREE = 600;

export function poser(nom: string, valeur: string): string {
  return `${nom}=${encodeURIComponent(valeur)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DUREE}`;
}

export function retirer(nom: string): string {
  return `${nom}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * La valeur d'un cookie, ou la chaîne vide.
 *
 * Jamais d'exception : l'en-tête vient du navigateur, donc il peut être absent
 * ou malformé. L'absence se propage en chaîne vide, que le parcours refuse déjà.
 */
export function lireCookie(entete: string | null, nom: string): string {
  if (!entete) return "";

  for (const morceau of entete.split(";")) {
    const separateur = morceau.indexOf("=");
    if (separateur === -1) continue;
    if (morceau.slice(0, separateur).trim() !== nom) continue;
    return decodeURIComponent(morceau.slice(separateur + 1).trim());
  }
  return "";
}
