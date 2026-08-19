# Héberger Orcha sur le VPS

Le déploiement ne sert **que le rôle service** : la page qui vend, l'espace
client, le paiement, et l'endpoint qui répond « ce compte a-t-il payé ? ».

L'application locale n'y existe pas. `ATELIER_PUBLIC=1` la fait répondre 404 —
elle lit et écrit un dossier `.claude`, qui serait ici celui du serveur. Un
inventaire du disque de l'hôte exposé à Internet, et des routes d'écriture qui
visent ce même disque, n'ont aucune raison d'être joignables.

Vérifié sur le serveur autonome, avant tout conteneur :

| Route | Code |
| --- | --- |
| `/produit`, `/tarif`, `/merci`, `/compte` | **200** |
| `/`, `/competences`, `/workflows` | **404** |

## Ce qu'il faut avant de lancer quoi que ce soit

1. **Un enregistrement DNS.** `orcha.vincentavz.com` n'existe pas aujourd'hui —
   `dig` ne rend rien. L'apex `vincentavz.com` pointe sur `213.186.33.5` (OVH),
   qui n'est probablement pas le VPS. Il faut un `A` vers l'IP du VPS.

2. **Une instance Clerk de PRODUCTION.** Celle en place est une instance de
   développement : `pk_test_…`, sur `.accounts.dev`. Elle **ne fonctionne pas**
   sur un domaine public. Créer l'instance de production, poser les
   enregistrements DNS que Clerk réclame (`clerk.orcha…`, `accounts.orcha…`),
   puis relever les deux clés. `clerk deploy` conduit l'opération.

3. **Un tarif Stripe en mode live.** Sans `NEXT_PUBLIC_STRIPE_PRICE_ID`, la page
   n'affiche aucun prix — le mécanisme refuse d'inventer un montant, et la revue
   en a fait son premier bloquant.

4. **Recréer l'application OAuth** côté instance de production, et reporter son
   `client_id` dans `ATELIER_ACCES_CLIENT`. Celle qui existe appartient à
   l'instance de développement.

## Le déploiement

Une commande, depuis ce poste :

```bash
./deployer.sh
```

Le script est idempotent et s'arrête net sur le premier prérequis manquant, en
disant lequel. Il ne transmet **aucun secret** : `.env.production` vit sur le
serveur et n'en bouge pas.

Variables d'ajustement : `ORCHA_HOTE`, `ORCHA_UTILISATEUR`, `ORCHA_DOMAINE`,
`ORCHA_DOSSIER`.

### Le serveur

`51.38.82.159`, reverse DNS `vps-49af6c4f.vps.ovh.net` — un VPS OVH, OpenSSH 10
sur Debian 13. Il n'accepte **que** `publickey`, aucun mot de passe.

**L'utilisateur est `azones`**, pas `root`. La clé du poste y est autorisée et
authentifie sans problème.

### `fail2ban` est actif — leçon apprise à la dure

Le 18 août 2026, un balayage de noms d'utilisateur a fait bannir l'IP du poste :
le port 22 a cessé de répondre **entièrement**, ICMP compris, alors que le 443
restait ouvert vu d'ailleurs. Vingt tentatives d'affilée ressemblent à une
attaque, et le serveur a réagi comme il devait.

Deux symptômes à ne pas confondre :

| Symptôme | Cause | Quoi faire |
| --- | --- | --- |
| `Permission denied (publickey)` | mauvaise clé ou mauvais utilisateur | corriger, puis un seul essai |
| port 22 **injoignable**, ping filtré | bannissement | **attendre**, ne pas réessayer |

Réessayer pendant un bannissement le prolonge. `deployer.sh` distingue les deux
cas et le dit.

### Il manque encore

L'enregistrement DNS `A` de `orcha.vincentavz.com` vers `51.38.82.159`.

Le conteneur ne publie **aucun port** sur l'hôte : il rejoint le réseau
`proxy`, et le proxy inverse déjà en place le joint par son nom. Publier 4300
exposerait l'application en clair, à côté du TLS plutôt que derrière.

Le contrôle de santé vise `/produit` et non `/` : la racine appartient au rôle
local, qui répond 404 ici par construction — un contrôle sur `/` dirait
« mort » à tort.

## Le piège des variables `NEXT_PUBLIC_`

Elles sont **inscrites dans le paquet à la compilation**, pas lues au
démarrage. En changer une impose `docker compose build`, pas seulement un
`restart`. C'est pourquoi elles sont des `ARG` du Dockerfile et non seulement
des lignes de `.env.production`.

## Ce que le conteneur fait autrement que la machine locale

Il écoute sur `0.0.0.0`. La consigne `--hostname 127.0.0.1` du README vise le
rôle **local**, où aucune action d'écriture n'est authentifiée et où le
loopback est la seule protection. Ici la frontière est le conteneur, et le
proxy est seul à publier quoi que ce soit. Ne pas transposer la règle d'un rôle
à l'autre.


## En ligne depuis le 18 août 2026

**https://orcha.vincentavz.com/produit** — Clerk en instance de **production**.

Terrain réel du VPS, constaté et non supposé :

| | |
| --- | --- |
| Réseau Docker | `admin_web` (pas `proxy`) |
| Proxy | `bpm-admin-caddy`, Caddy 2-alpine, détient 80/443 |
| Caddyfile | `/home/azones/bpm-connect/admin/Caddyfile` — sauvegardé en `.avant-orcha` |
| Source | `/home/azones/orcha`, transférée par `tar` sur SSH (dépôt privé, pas de clé de déploiement) |
| Instance Clerk | `ins_3I7uUzhwxlvMxUn1kIi4mB7AZ7j` |
| Application OAuth prod | `R3jV1FdfllVvQvQ7`, client public PKCE |

Vérifié en ligne : `/produit`, `/tarif`, `/merci`, `/compte` en **200** ; `/`,
`/competences` en **404** — le rôle local est éteint par `ATELIER_PUBLIC=1`.
Zéro erreur console, HSTS actif, et les trois autres sites du VPS intacts.

### Ce qui manque encore pour vendre

- **Aucun tarif Stripe** : la page n'affiche pas de prix et le paiement est
  inopérant. `NEXT_PUBLIC_STRIPE_PRICE_ID` et `STRIPE_SECRET_KEY` sont absents
  de `.env.production`.
- **Le dépôt est privé** : un acheteur ne pourrait pas installer ce qu'il a
  payé. Voir la section « distribution » de la landing, qui le signale.
