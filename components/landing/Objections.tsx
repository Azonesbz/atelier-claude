import type { ReactNode } from "react";

/**
 * Les six objections réelles, y compris celles auxquelles on répond « non ».
 *
 * Ce n'est pas de la documentation déguisée : chaque entrée est une phrase que
 * le lecteur se dit avant de fermer l'onglet. Les limites sont écrites telles
 * quelles — ça ne répare rien, seules les compétences sont modifiables — parce
 * que devant un public qui lira le code, une limite tue par surprise ce
 * qu'elle ne coûte presque rien à annoncer.
 *
 * `<details>` natif plutôt qu'un accordéon : clavier et lecteurs d'écran gérés
 * par le navigateur, zéro dépendance, zéro JavaScript client. Le marqueur par
 * défaut est retiré des deux moteurs et remplacé par un signe qui suit l'état.
 */

function Objection({ question, children }: { question: ReactNode; children: ReactNode }) {
  return (
    <details className="group card border-line-strong px-5 py-4 open:bg-surface-muted">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <span aria-hidden className="font-mono text-muted">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="mt-3 max-w-prose text-ink-soft">{children}</div>
    </details>
  );
}

export function Objections() {
  return (
    <section className="mt-20">
      <h2 className="surtitre">// OBJECTIONS</h2>

      <div className="mt-5 space-y-2">
        <Objection
          question={
            <>
              « <code className="font-mono">claude doctor</code> ne suffit pas ? »
            </>
          }
        >
          Sur la machine en panne, il répondait «&nbsp;No installation issues found&nbsp;». Il ne
          regarde ni les plugins, ni les compétences, ni les agents.
        </Objection>

        <Objection question="« Le dépôt est ouvert. Pourquoi payer ? »">
          Parce que rien ne t&apos;y oblige, et c&apos;est assumé. Une application qui tourne chez
          toi se modifie. La licence est un rituel de paiement honnête, pas un verrou. Tu peux tout
          lire sans payer, et tout modifier à la main dans ton éditeur.
        </Objection>

        <Objection question="« Qu'est-ce qui part sur le réseau ? »">
          Une question, une réponse. Ton compte a-t-il payé — oui ou non. Rien de ton dossier{" "}
          <code className="font-mono">.claude</code> ne quitte la machine : le service n&apos;a
          d&apos;ailleurs aucune base de données.
        </Objection>

        <Objection question="« Ça répare les écarts ? »">
          Non. Il nomme la commande de réparation ; il ne la lance jamais à ta place.
        </Objection>

        <Objection question="« Ça modifie tout ? »">
          Non, et c&apos;est la limite du moment :{" "}
          <strong className="font-semibold text-ink">seules les compétences</strong> sont
          modifiables depuis l&apos;interface. Agents, commandes, hooks et règles de permission
          restent en lecture seule. La veille, elle, ne couvre que les plugins.
        </Objection>

        <Objection question="« Ça me donne l'état complet de ma configuration ? »">
          Non. Une couche de réglages administrés est délivrée à la connexion, sans fichier local,
          et il faut y ajouter les arguments CLI et l&apos;environnement. Aucun outil lisant le
          disque ne dira «&nbsp;voici l&apos;état effectif&nbsp;». Orcha dit «&nbsp;voici un écart
          certain&nbsp;», ce qui est plus étroit et vérifiable.
        </Objection>
      </div>
    </section>
  );
}
