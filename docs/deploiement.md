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

```bash
# sur le VPS
git clone git@github.com:Azonesbz/atelier-claude.git orcha && cd orcha
cp .env.production.exemple .env.production && $EDITOR .env.production
docker compose build && docker compose up -d
docker compose ps          # l'état de santé doit passer à « healthy »
```

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
