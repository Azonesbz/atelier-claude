/**
 * Cette instance est-elle le déploiement public ?
 *
 * Le dépôt tient deux rôles : l'application locale, qui lit le `.claude` de la
 * machine, et le site public, qui présente le projet.
 *
 * Sur un domaine public, l'application locale n'existe pas — elle lirait le
 * dossier du serveur, et ses routes d'écriture viseraient ce même disque. À
 * l'inverse, les pages publiques n'ont rien à faire chez quelqu'un qui a lancé
 * l'outil sur sa machine.
 *
 * Une seule variable sépare les deux. Il y en avait une seconde, adossée aux
 * clés Clerk, du temps où le service authentifiait et encaissait ; elle n'a
 * plus d'objet.
 */
export function estPublic(): boolean {
  return Boolean(process.env.ATELIER_PUBLIC);
}
