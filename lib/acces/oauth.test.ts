/**
 * La construction des requêtes OAuth, et surtout ce qu'elles ne doivent pas porter.
 *
 * Aucun appel réseau ici : ces fonctions fabriquent une adresse et un corps de
 * requête, rien de plus. C'est justement ce qu'il faut pouvoir prouver sans
 * dépendre de Clerk.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { adresseAutorisation, corpsEchange, corpsRafraichissement, fournisseur } from "./oauth.ts";

const CLES = [
  "ATELIER_ACCES_EMETTEUR",
  "ATELIER_ACCES_CLIENT",
  "ATELIER_ACCES_REDIRECTION",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_ATELIER_ACCES_CLIENT",
] as const;

/** base64 de « clerk.exemple.com$ ». */
const CLE_PUBLIABLE = "pk_live_Y2xlcmsuZXhlbXBsZS5jb20k";

function poser(valeurs: Partial<Record<(typeof CLES)[number], string>>) {
  for (const cle of CLES) delete process.env[cle];
  for (const [cle, valeur] of Object.entries(valeurs)) process.env[cle] = valeur;
}

afterEach(() => {
  for (const cle of CLES) delete process.env[cle];
});

const FOURNISSEUR = {
  emetteur: "https://clerk.exemple.com",
  clientId: "client_abc",
  redirection: "http://127.0.0.1:4300/api/auth/retour",
};

test("sans configuration, il n'y a pas de fournisseur — et ça n'est pas une erreur", () => {
  // Arrange — le cas de l'application locale d'un lecteur, qui ne se connecte jamais
  poser({});

  // Act & Assert — lire doit rester gratuit, donc démarrer sans variable d'accès
  assert.equal(fournisseur(), null);
});

test("un émetteur sans identifiant client ne fait pas un fournisseur à moitié", () => {
  // Arrange
  poser({ ATELIER_ACCES_EMETTEUR: "https://clerk.exemple.com" });

  // Act & Assert — mieux vaut pas de connexion du tout qu'une redirection cassée
  assert.equal(fournisseur(), null);
});

test("faute d'émetteur déclaré, il se déduit de la clé publiable", () => {
  // Arrange — une variable de moins à remplir, et une faute d'accord en moins
  poser({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: CLE_PUBLIABLE, ATELIER_ACCES_CLIENT: "client_abc" });

  // Act
  const f = fournisseur();

  // Assert
  assert.equal(f?.emetteur, "https://clerk.exemple.com");
});

test("l'émetteur déclaré l'emporte sur celui que la clé publiable donnerait", () => {
  // Arrange — le cas d'un domaine personnalisé, ou d'une instance de rechange
  poser({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: CLE_PUBLIABLE,
    ATELIER_ACCES_EMETTEUR: "https://acces.mon-domaine.fr",
    ATELIER_ACCES_CLIENT: "client_abc",
  });

  // Act & Assert
  assert.equal(fournisseur()?.emetteur, "https://acces.mon-domaine.fr");
});

test("une clé publiable seule ne suffit pas : sans application OAuth, pas de connexion", () => {
  // Arrange — l'erreur probable : croire que les clés du SDK suffisent
  poser({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: CLE_PUBLIABLE });

  // Act & Assert
  assert.equal(fournisseur(), null);
});

test("la barre oblique finale de l'émetteur ne fabrique pas d'adresse à double barre", () => {
  // Arrange
  poser({ ATELIER_ACCES_EMETTEUR: "https://clerk.exemple.com/", ATELIER_ACCES_CLIENT: "client_abc" });

  // Act
  const f = fournisseur();

  // Assert
  assert.equal(f?.emetteur, "https://clerk.exemple.com");
});

test("faute de redirection déclarée, on retombe sur le port que le produit impose", () => {
  // Arrange — package.json cloue l'écoute sur 127.0.0.1:4300, le README l'exige
  poser({ ATELIER_ACCES_EMETTEUR: "https://clerk.exemple.com", ATELIER_ACCES_CLIENT: "client_abc" });

  // Act
  const f = fournisseur();

  // Assert
  assert.equal(f?.redirection, "http://127.0.0.1:4300/api/auth/retour");
});

test("l'adresse d'autorisation porte tout ce que le flux public exige", () => {
  // Act
  const adresse = new URL(
    adresseAutorisation(FOURNISSEUR, { defi: "un-defi", etat: "un-etat-anti-csrf" }),
  );

  // Assert
  assert.equal(adresse.origin + adresse.pathname, "https://clerk.exemple.com/oauth/authorize");
  const p = adresse.searchParams;
  assert.equal(p.get("response_type"), "code");
  assert.equal(p.get("client_id"), "client_abc");
  assert.equal(p.get("code_challenge"), "un-defi");
  assert.equal(p.get("code_challenge_method"), "S256");
  assert.equal(p.get("redirect_uri"), FOURNISSEUR.redirection);
  assert.equal(p.get("state"), "un-etat-anti-csrf");
});

test("le jeton de rafraîchissement est demandé, sinon l'écriture se referme au premier réveil", () => {
  // Act
  const portees = new URL(adresseAutorisation(FOURNISSEUR, { defi: "d", etat: "e" })).searchParams
    .get("scope")
    ?.split(" ");

  // Assert — sans `offline_access`, pas de rafraîchissement, donc pas de tolérance hors ligne
  assert.ok(portees?.includes("offline_access"), `portées demandées : ${portees?.join(", ")}`);
  assert.ok(portees?.includes("email"), "l'espace client doit pouvoir nommer l'acheteur");
});

test("l'échange du code porte le vérifieur et aucun secret client", () => {
  // Act
  const corps = corpsEchange(FOURNISSEUR, { code: "le-code", verifieur: "le-verifieur" });

  // Assert
  assert.equal(corps.get("grant_type"), "authorization_code");
  assert.equal(corps.get("code"), "le-code");
  assert.equal(corps.get("code_verifier"), "le-verifieur");
  assert.equal(corps.get("client_id"), "client_abc");
  assert.equal(corps.get("redirect_uri"), FOURNISSEUR.redirection);
  // Un secret distribué avec le produit n'est pas un secret : PKCE le remplace.
  assert.equal(corps.get("client_secret"), null);
});

test("le rafraîchissement ne porte pas de secret client non plus", () => {
  // Act
  const corps = corpsRafraichissement(FOURNISSEUR, { jeton: "le-jeton-de-rafraichissement" });

  // Assert
  assert.equal(corps.get("grant_type"), "refresh_token");
  assert.equal(corps.get("refresh_token"), "le-jeton-de-rafraichissement");
  assert.equal(corps.get("client_id"), "client_abc");
  assert.equal(corps.get("client_secret"), null);
});

test("l'identifiant client peut être inscrit au paquet, car il est public", () => {
  // Arrange — dans un paquet npm distribué, rien n'est lu à l'exécution : les
  // valeurs doivent être inscrites à la compilation. C'est admissible ici
  // parce que PKCE protège précisément un client dont l'identifiant circule.
  poser({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: CLE_PUBLIABLE,
    NEXT_PUBLIC_ATELIER_ACCES_CLIENT: "client_du_paquet",
  });

  // Act & Assert
  assert.equal(fournisseur()?.clientId, "client_du_paquet");
});

test("la variable d'exécution l'emporte sur celle du paquet", () => {
  // Arrange — un développeur doit pouvoir viser une autre application OAuth
  poser({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: CLE_PUBLIABLE,
    NEXT_PUBLIC_ATELIER_ACCES_CLIENT: "client_du_paquet",
    ATELIER_ACCES_CLIENT: "client_local",
  });

  // Act & Assert
  assert.equal(fournisseur()?.clientId, "client_local");
});
