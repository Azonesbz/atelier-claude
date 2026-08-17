# Remplacer la clé de licence par un compte

Cadrage, pas encore une décision appliquée. Rien de ce qui suit n'est dans le
code : la clé signée reste le mécanisme en place.

## Ce qui change, et ce qui ne peut pas changer

L'application tient **deux rôles dans un seul dépôt**, et c'est la contrainte
qui commande tout le reste :

| Rôle | Où | Ce qu'il a le droit de faire |
| --- | --- | --- |
| Application locale | `127.0.0.1:4300`, machine de l'acheteur | lire et écrire `~/.claude` |
| Service | déploiement public | détenir les secrets, répondre « cette personne a-t-elle payé ? » |

Aujourd'hui les deux se distinguent par `NEXT_PUBLIC_ATELIER_SERVICE`, présent
ou absent. **Un fournisseur d'accès ne doit jamais fuir dans le rôle local** :
pas de middleware d'authentification à la racine, aucune variable d'IdP requise
pour démarrer chez l'acheteur. Lire reste gratuit, donc lire ne se connecte pas.

Et ceci reste vrai après le changement, il faut l'écrire noir sur blanc :
**aucune action d'écriture locale n'est authentifiée**. Se connecter prouve
qu'un compte a *payé*, jamais qu'une requête POST vient de son propriétaire. Qui
a le navigateur de la machine écrit, connecté ou pas. `--hostname 127.0.0.1`
reste la seule protection, et le paragraphe du README reste exact.

## Le parcours

L'application locale **est** une page web : elle a déjà un navigateur. Pas
besoin du device flow des CLI — le retour de redirection en loopback suffit, et
la RFC 8252 §7.3 le prévoit explicitement pour les applications natives.

1. L'acheteur clique « Se connecter » dans l'application locale.
2. Redirection vers la page hébergée de l'IdP, en **client public + PKCE**.
   Toutes les instances partagent le même `client_id` : c'est le motif natif
   normal, et PKCE est ce qui le rend sûr sans secret embarqué.
3. Retour sur `http://127.0.0.1:4300/api/auth/retour`. Le port est fixe et le
   README interdit déjà d'y toucher : l'URI de redirection est donc stable et
   enregistrable une fois pour toutes.
4. L'application locale demande au service : « ce compte a-t-il payé ? ». Le
   service fait la jointure compte IdP → client Stripe, et répond oui ou non.
   Stripe reste la source de vérité du paiement — on n'en fabrique pas une
   seconde.

L'**espace client** est la page du service où l'acheteur se connecte pour voir
son achat, le gérer, demander un remboursement. C'est du côté déployé, et chez
la plupart des fournisseurs elle est déjà fournie.

## Le cas tordu, et c'est le vrai risque

Le mécanisme actuel a une vertu qu'on perd très facilement : **il ne se referme
jamais sur quelqu'un qui a payé.** L'achat est unique, la licence perpétuelle,
le cache dure trente jours et une panne réseau ne retire rien — `etat.ts` le
dit et le code le tient. Quelqu'un dans un train garde son écriture.

Un jeton OAuth, lui, **expire par construction**. Un rafraîchissement qui échoue
hors ligne, et l'acheteur perd l'écriture qu'il a payée une fois pour toutes.

C'est la seule régression sérieuse du changement, et elle doit être traitée
avant d'écrire une ligne : le droit d'écrire se met en cache **avec la même
tolérance qu'aujourd'hui** — jamais fermé sur un échec réseau, seul un service
joint et catégorique peut retirer le droit. Le jeton sert à établir le droit,
pas à le maintenir.

À noter au passage : `EtatLicence` déclare un état `hors-ligne` que
`ecritureOuverte()` traite comme ouvert, mais `depuisCache()` ne le renvoie
jamais — la branche est morte. Le comportement est correct malgré tout, parce
qu'une licence valide reste `active`. À ne pas recopier tel quel.

## Le piège de l'écoute : `127.0.0.1` contre `localhost`

Constaté, mesuré, et il remordra si on l'oublie.

Le middleware Clerk réécrit vers `http://localhost:<port>/…`. Next va chercher
cette adresse **depuis Node**, et Node résout `localhost` vers `::1` en premier
— `/etc/hosts` déclare les deux piles. Or `npm run dev` cloue l'écoute sur
`127.0.0.1`, en IPv4 seulement. Personne ne répond sur `::1`, et la requête
meurt en `socket hang up` que Next rend en 500.

Même code, même configuration, seule l'adresse d'écoute change :

| Écoute | une route passée au middleware Clerk |
| --- | --- |
| `127.0.0.1` (IPv4) | **500** |
| `::1` (via `--hostname localhost`) | **200** |

`curl` masque le problème : il retombe sur IPv4 tout seul. Node, non.

Le correctif n'est pas de toucher à `npm run dev` — son `--hostname 127.0.0.1`
protège des routes d'écriture qui ne sont **pas** authentifiées, et `127.0.0.1`
a l'avantage d'être sans ambiguïté sur toutes les machines. C'est
`npm run dev:service` qui sert à travailler le rôle service, en double pile. Le
rôle local n'a de toute façon pas de middleware Clerk : `estService()` y est
faux, et rien n'est intercepté.

## Le coût ne départage pas

Vérifié en août 2026, et c'est un résultat utile : à l'échelle de ce produit,
**aucun fournisseur ne facture**.

| Fournisseur | Gratuit jusqu'à |
| --- | --- |
| WorkOS AuthKit | 1 000 000 MAU |
| Clerk | 50 000 MRU |
| Auth0 | 25 000 MAU |

Le critère est donc l'intégration, pas la facture.

- **Clerk** — le plus proche du besoin : intégration Next.js native, et son
  Account Portal *est* l'espace client, donc il n'y a pas à le construire.
  Réserve : `clerkMiddleware()` s'installe à la racine ; il faut le confiner par
  un `matcher` pour que le rôle local n'y touche jamais.
- **WorkOS AuthKit** — pages hébergées, gratuit très loin, et il porte
  nativement le Device Authorization Grant si un vrai CLI arrive un jour.
- **Auth0** — le plus lourd pour le moins d'avantage ici.

## Ce qui est tranché

- **Le fournisseur : Clerk**, employé comme fournisseur OIDC brut côté local, et
  via son SDK côté service seulement.
- **Aucun acheteur à ce jour**, donc **on coupe net** : pas de passerelle clé →
  compte à construire. `lib/licence/cle.ts` et `app/api/licence` disparaissent
  une fois les comptes en place, pas avant.

## Ce qui reste à trancher

- **La fiche.** `idees/atelier-claude.md` tranche aujourd'hui l'inverse : « Ni
  compte, ni session, ni mot de passe. » Elle change avec le code, sinon le
  dépôt ment.
- **Le lien compte ↔ paiement.** Stripe reste la source de vérité du paiement,
  mais rien ne relie encore une session de paiement à un compte. Le plus simple
  est de poser l'identifiant du compte en `client_reference_id` à l'ouverture
  de la session Stripe — c'est fait pour ça, et ça n'ajoute aucune table.
- **L'instance Clerk.** Celle en place est une instance de développement
  (`pk_test`, sur `.accounts.dev`). Un produit distribué demandera une instance
  de production sur un domaine à soi.
