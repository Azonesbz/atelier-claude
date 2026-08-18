# syntax=docker/dockerfile:1

# L'image du RÔLE SERVICE uniquement — la page qui vend, l'espace client, le
# paiement. Jamais l'application locale : elle lit le `.claude` de la machine,
# qui serait ici celui du serveur. `ATELIER_PUBLIC` l'éteint, plus bas.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Les variables `NEXT_PUBLIC_*` sont inscrites dans le paquet client à la
# compilation : elles doivent être là MAINTENANT, pas au démarrage.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_ATELIER_SERVICE
ARG NEXT_PUBLIC_STRIPE_PRICE_ID
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_ATELIER_SERVICE=$NEXT_PUBLIC_ATELIER_SERVICE \
    NEXT_PUBLIC_STRIPE_PRICE_ID=$NEXT_PUBLIC_STRIPE_PRICE_ID \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=4300
# Le déploiement est public : l'application locale n'y existe pas.
ENV ATELIER_PUBLIC=1

# Un utilisateur sans privilège : le processus n'a aucune raison d'être root.
RUN addgroup -S orcha && adduser -S orcha -G orcha
COPY --from=build --chown=orcha:orcha /app/.next/standalone ./
COPY --from=build --chown=orcha:orcha /app/.next/static ./.next/static
COPY --from=build --chown=orcha:orcha /app/public ./public
USER orcha

EXPOSE 4300
# 0.0.0.0 et non 127.0.0.1 : ici la frontière est le conteneur, et le proxy
# inverse est le seul à publier le port. La consigne `--hostname 127.0.0.1` du
# README vise le rôle LOCAL, où rien n'est authentifié — pas celui-ci.
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
