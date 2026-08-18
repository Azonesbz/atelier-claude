# Router `orcha.vincentavz.com` vers le conteneur

Le proxy inverse en place sur le VPS est **Caddy** — constaté le 18 août 2026
(`Server: Caddy`, redirection 308 vers HTTPS sur le port 80).

Caddy obtient et renouvelle le certificat TLS tout seul, à condition que
l'enregistrement DNS `A` de `orcha.vincentavz.com` pointe déjà vers
`51.38.82.159` **avant** le premier démarrage : Let's Encrypt vérifie le
domaine, et il échouera tant que le nom ne résout pas.

## Éprouvé, pas supposé

Le bloc ci-dessous a été essayé pour de vrai le 18 août 2026 — conteneur Orcha
et conteneur Caddy sur un même réseau Docker, sur le poste de développement.
À travers le proxy : `/produit`, `/tarif`, `/merci` et `/compte` en **200**,
`/` et `/workflows` en **404**, page servie intacte (titre, appel à l'action,
auteur, pied légal). La résolution par nom de service fonctionne.

Seul le TLS n'a pas pu être essayé : Let's Encrypt ne peut rien vérifier depuis
une machine de développement. C'est le seul inconnu restant, et il se lève tout
seul si le DNS résout avant le premier démarrage.

## Si Caddy tourne dans un conteneur

Il doit partager le réseau `proxy` avec Orcha, sinon il ne peut pas joindre le
conteneur par son nom :

```bash
docker network connect proxy <nom-du-conteneur-caddy>
```

Puis dans le `Caddyfile` :

```caddyfile
orcha.vincentavz.com {
	reverse_proxy orcha:4300
}
```

`orcha` est le nom du service dans `compose.yaml`, résolu par le DNS interne de
Docker. Recharger sans interruption :

```bash
docker exec <nom-du-conteneur-caddy> caddy reload --config /etc/caddy/Caddyfile
```

## Si Caddy tourne sur l'hôte

Il ne voit pas le réseau Docker. Il faut publier un port local — et **seulement**
local, pas sur toutes les interfaces. Dans `compose.yaml`, remplacer `expose`
par :

```yaml
    ports:
      - "127.0.0.1:4300:4300"
```

Puis :

```caddyfile
orcha.vincentavz.com {
	reverse_proxy 127.0.0.1:4300
}
```

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

## Ce qu'il ne faut pas faire

Ne pas réécrire le `Caddyfile` existant : il sert les autres sites du VPS.
Ajouter un bloc, jamais remplacer le fichier.

Et ne pas publier `4300` sur `0.0.0.0` : l'application serait alors joignable
en clair depuis Internet, à côté du TLS au lieu d'être derrière.
