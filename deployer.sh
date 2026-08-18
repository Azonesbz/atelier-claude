#!/usr/bin/env bash
# Déploie le rôle service d'Orcha sur le VPS, depuis ce poste, par SSH.
#
# Idempotent : relançable sans rien casser. Il ne crée AUCUN secret — le
# fichier .env.production vit sur le serveur et n'est jamais transmis d'ici.
set -euo pipefail

HOTE="${ORCHA_HOTE:-51.38.82.159}"
UTILISATEUR="${ORCHA_UTILISATEUR:-azones}"
DOMAINE="${ORCHA_DOMAINE:-orcha.vincentavz.com}"
DOSSIER="${ORCHA_DOSSIER:-/opt/orcha}"
RESEAU="${ORCHA_RESEAU:-proxy}"
DEPOT="git@github.com:Azonesbz/atelier-claude.git"

vps() { ssh -o BatchMode=yes -o ConnectTimeout=10 "$UTILISATEUR@$HOTE" "$@"; }

echo "→ 1/6  Accès SSH"
if ! vps true 2>/dev/null; then
  echo "   ✗ $UTILISATEUR@$HOTE refuse la connexion."
  echo "     Clé à autoriser dans ~/.ssh/authorized_keys du serveur :"
  cat ~/.ssh/id_ed25519.pub
  exit 1
fi
# Le mode rescue d'OVH répond aussi au SSH : sans ce contrôle, on déploierait
# dans un système de secours dont le disque part au redémarrage.
if vps 'grep -qi bpo /usr/share/doc/openssh-server/changelog.Debian.gz 2>/dev/null || ! test -d /opt' 2>/dev/null; then
  banniere=$(nc -w 5 "$HOTE" 22 2>/dev/null | head -1 || true)
  case "$banniere" in
    *bpo*) echo "   ✗ Le serveur est en MODE RESCUE ($banniere)."
           echo "     Manager OVH → VPS → Démarrage → sur le disque, puis redémarre."
           exit 1;;
  esac
fi
echo "   ✓ $UTILISATEUR@$HOTE joignable"

echo "→ 2/6  DNS"
if ! host "$DOMAINE" >/dev/null 2>&1; then
  echo "   ✗ $DOMAINE ne résout pas. Pose un enregistrement A vers $HOTE."
  exit 1
fi
echo "   ✓ $DOMAINE résout"

echo "→ 3/6  Terrain : Docker, réseau, proxy inverse"
vps "command -v docker >/dev/null" || { echo "   ✗ Docker absent du VPS."; exit 1; }
if ! vps "docker network inspect '$RESEAU' >/dev/null 2>&1"; then
  echo "   · réseau '$RESEAU' absent — création"
  vps "docker network create '$RESEAU'" >/dev/null
fi
proxy=$(vps "docker ps --format '{{.Image}} {{.Names}}' 2>/dev/null | grep -iE 'traefik|nginx|caddy|haproxy' | head -3" || true)
proxy_hote=$(vps "systemctl is-active nginx caddy haproxy 2>/dev/null | grep -c '^active'" || echo 0)
if [ -n "$proxy" ]; then
  echo "   ✓ proxy en conteneur :"; echo "$proxy" | sed 's/^/       /'
elif [ "${proxy_hote:-0}" -gt 0 ]; then
  echo "   ✓ proxy sur l'hôte (nginx/caddy/haproxy actif)"
  echo "     ⚠️ Il ne verra pas le conteneur par le réseau Docker : publie un port"
  echo "        local et fais pointer le vhost dessus, ou attache le proxy à '$RESEAU'."
else
  echo "   ⚠️ Aucun proxy inverse détecté. Le conteneur tournera sans être routé,"
  echo "      et $DOMAINE ne répondra pas. À régler avant de compter sur l'URL."
fi

echo "→ 4/6  Code à jour"
vps "set -e
  if [ -d '$DOSSIER/.git' ]; then cd '$DOSSIER' && git fetch --quiet origin && git reset --hard --quiet origin/main
  else git clone --quiet '$DEPOT' '$DOSSIER'; fi"
echo "   ✓ dépôt synchronisé sur $DOSSIER"

echo "→ 5/6  Secrets de production"
if ! vps "test -s '$DOSSIER/.env.production'"; then
  echo "   ✗ $DOSSIER/.env.production absent ou vide."
  echo "     Sur le serveur : cp $DOSSIER/.env.production.exemple $DOSSIER/.env.production"
  echo "     puis remplis-le LÀ-BAS — rien de secret ne transite par ce poste."
  exit 1
fi
echo "   ✓ présent"

echo "→ 6/6  Construction et démarrage"
# Les NEXT_PUBLIC_* sont inscrites dans le paquet à la compilation : `build` est
# obligatoire, un simple `up` servirait l'ancien paquet.
vps "cd '$DOSSIER' && set -a && . ./.env.production && set +a && docker compose build --quiet && docker compose up -d"

echo "   attente de l'état « healthy »…"
etat=inconnu
for _ in $(seq 1 30); do
  etat=$(vps "cd '$DOSSIER' && docker compose ps --format '{{.Health}}' 2>/dev/null | head -1" || true)
  [ "$etat" = "healthy" ] && break
  sleep 4
done
echo "   conteneur : ${etat:-inconnu}"

echo
echo "Contrôle public sur https://$DOMAINE"
for route in /produit /tarif /merci /compte; do
  printf "  %-10s %s\n" "$route" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$DOMAINE$route" || echo injoignable)"
done
printf "  %-10s %s  (404 attendu : le rôle local n'existe pas ici)\n" "/" \
  "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$DOMAINE/" || echo '-')"
