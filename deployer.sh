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
DEPOT="git@github.com:Azonesbz/atelier-claude.git"

ssh_vps() { ssh -o BatchMode=yes -o ConnectTimeout=10 "$UTILISATEUR@$HOTE" "$@"; }

echo "→ 1/5  Accès SSH"
if ! ssh_vps true 2>/dev/null; then
  echo "   ✗ $UTILISATEUR@$HOTE injoignable."
  echo "     Deux causes possibles, à distinguer avant de réessayer :"
  echo "     · la clé n'est pas autorisée — ajoute-la sur le serveur :"
  cat ~/.ssh/id_ed25519.pub
  echo "     · l'IP est bannie (fail2ban) — le port 22 ne répond alors PLUS DU TOUT."
  echo "       Ne pas réessayer en boucle : chaque tentative prolonge le bannissement."
  nc -z -G 5 "$HOTE" 22 2>/dev/null \
    && echo "       → port 22 ouvert : c'est donc la clé ou l'utilisateur." \
    || echo "       → port 22 injoignable : c'est un bannissement. Attendre."
  exit 1
fi
echo "   ✓ joignable"

echo "→ 2/5  DNS"
if ! host "$DOMAINE" >/dev/null 2>&1; then
  echo "   ✗ $DOMAINE ne résout pas. Pose un enregistrement A vers $HOTE."
  exit 1
fi
echo "   ✓ $DOMAINE résout"

echo "→ 3/5  Code à jour sur le serveur"
ssh_vps "set -e
  if [ -d '$DOSSIER/.git' ]; then
    cd '$DOSSIER' && git fetch --quiet origin && git reset --hard --quiet origin/main
  else
    git clone --quiet '$DEPOT' '$DOSSIER'
  fi"
echo "   ✓ dépôt synchronisé"

echo "→ 4/5  Secrets de production"
if ! ssh_vps "test -s '$DOSSIER/.env.production'"; then
  echo "   ✗ $DOSSIER/.env.production absent ou vide sur le serveur."
  echo "     Copie le modèle et remplis-le LÀ-BAS, jamais ici :"
  echo "       ssh $UTILISATEUR@$HOTE 'cp $DOSSIER/.env.production.exemple $DOSSIER/.env.production && \$EDITOR $DOSSIER/.env.production'"
  exit 1
fi
echo "   ✓ présent"

echo "→ 5/5  Construction et démarrage"
# Les NEXT_PUBLIC_* sont inscrites dans le paquet à la compilation : `build` est
# obligatoire, un simple `up` servirait l'ancien paquet.
ssh_vps "cd '$DOSSIER' && set -a && . ./.env.production && set +a && docker compose build --quiet && docker compose up -d"

echo "   attente de l'état « healthy »…"
for _ in $(seq 1 30); do
  etat=$(ssh_vps "cd '$DOSSIER' && docker compose ps --format '{{.Health}}' 2>/dev/null | head -1" || true)
  [ "$etat" = "healthy" ] && break
  sleep 4
done

echo
echo "État du conteneur : ${etat:-inconnu}"
echo "Contrôle public :"
for route in /produit /tarif /merci; do
  printf "  %-10s %s\n" "$route" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$DOMAINE$route" || echo "injoignable")"
done
echo "  /          $(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$DOMAINE/" || echo '-') (404 attendu : le rôle local n'existe pas ici)"
