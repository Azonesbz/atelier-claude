/**
 * Lequel des deux rôles cette instance tient-elle ?
 *
 * Le dépôt en porte deux : l'application locale, sur la machine de l'acheteur,
 * et le service déployé. Le SDK Clerk n'appartient qu'au second — il réclame
 * `CLERK_SECRET_KEY`, qui ouvre la Backend API et ne peut donc pas descendre
 * chez un client.
 *
 * Ce prédicat existe parce que le SDK ne tolère pas l'absence de ses clés :
 * `ClerkProvider` et `clerkMiddleware()` lèvent. Posés sans condition — ce que
 * fait l'installation par défaut — ils éteignent l'application entière chez
 * quiconque n'a pas de compte, y compris pour la lecture, qui est gratuite.
 */

/** Les deux clés, ou aucune. Une configuration à moitié posée n'est pas un service. */
export function estService(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/**
 * Cette instance est-elle le déploiement public ?
 *
 * Distinct de `estService()`, et il faut les deux : la machine de développement
 * porte les clés Clerk sans être publique. Confondre les deux éteindrait
 * l'application locale dès qu'on travaille le service.
 *
 * Ce que ça commande : sur un domaine public, l'application locale n'existe
 * pas. Elle lit et écrit un dossier `.claude` — sur un serveur ce serait celui
 * du serveur. Un inventaire de son disque exposé à Internet, et des routes
 * d'écriture qui visent ce même disque, n'ont aucune raison d'être joignables.
 */
export function estPublic(): boolean {
  return Boolean(process.env.ATELIER_PUBLIC);
}
