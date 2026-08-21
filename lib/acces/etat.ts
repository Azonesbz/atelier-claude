/**
 * L'état d'accès, côté application locale.
 *
 * Il n'y a plus rien à vérifier. Le produit est libre, sous licence MIT, et
 * l'écriture est ouverte à quiconque lance l'outil sur sa propre machine.
 *
 * Ce module reste — réduit à une constante — parce que `ecritureOuverte()`
 * était le contrat unique que posaient les quatre garde-fous d'écriture. Le
 * garder évite de disséminer la décision dans les pages, et laisse un seul
 * endroit à changer si un jour une condition revenait.
 *
 * Ce qui protège encore ce dossier n'a jamais été le paiement : c'est
 * l'écoute clouée sur 127.0.0.1, et les trois garde-fous de `lib/ecriture`
 * qui refusent d'écrire hors des racines `.claude` connues ou dans un plugin.
 */

export type EtatCompte = { etat: "ouverte" };

export async function etatDAcces(): Promise<EtatCompte> {
  return { etat: "ouverte" };
}

/** Le seul appel dont les garde-fous d'écriture ont besoin. */
export async function ecritureOuverte(): Promise<boolean> {
  return true;
}
