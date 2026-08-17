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

## Ce qui reste à trancher

- **Le fournisseur.**
- **Les acheteurs déjà là.** Ceux qui détiennent une clé `AC-…` doivent pouvoir
  la rattacher à un compte, sinon le changement casse des clients payants. S'il
  n'y en a aucun, on coupe net et le sujet disparaît.
- **La fiche.** `idees/atelier-claude.md` tranche aujourd'hui l'inverse : « Ni
  compte, ni session, ni mot de passe. » Elle change avec le code, sinon le
  dépôt ment.
