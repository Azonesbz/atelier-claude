export const dynamic = "force-dynamic";

/**
 * La page d'après-paiement, côté service.
 *
 * Plus rien à copier depuis ici. L'achat est rattaché au compte au moment de la
 * session Stripe : l'application locale le retrouve seule en interrogeant le
 * service, et l'écriture s'ouvre au prochain chargement.
 *
 * C'est tout l'intérêt d'avoir remplacé la clé par un compte — il n'y a plus de
 * secret à transporter à la main, donc plus de secret à perdre.
 */
export default function Merci() {
  return (
    <main className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl">Merci</h1>
      <p className="mt-3 text-sm text-muted">
        L&apos;achat est rattaché à ton compte. Rien à copier : retourne dans
        l&apos;application, page « Compte », et l&apos;écriture s&apos;ouvre. Elle ne périme
        pas — l&apos;achat est unique, mises à jour comprises.
      </p>
      <p className="mt-3 text-xs text-muted">
        Si l&apos;écriture reste fermée, vérifie que tu es connecté au même compte que celui
        qui a payé.
      </p>
    </main>
  );
}
