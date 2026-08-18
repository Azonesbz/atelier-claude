import type { ReactNode } from "react";
import { ARemplir } from "./ARemplir";

/**
 * Ce que l'outil touche sur le disque — dit avant l'installation, pas après.
 *
 * Un programme qui lit `~/.claude` et se propose d'y écrire réclame une
 * confiance que personne ne doit accorder sur parole. Les quatre garde-fous
 * sont donc posés pendant que le lecteur peut encore dire non, et en clair
 * plutôt que dans une page annexe : sur cette cible ils sont l'argument de
 * vente, pas la mention légale.
 */

function GardeFou({
  rang,
  titre,
  children,
}: {
  rang: number;
  titre: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="card flex gap-4 p-5">
      {/* Le rang est déjà porté par la liste ordonnée : ce jeton n'est que son écho visible. */}
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-md border border-line-strong font-mono text-xs text-muted"
      >
        {rang}
      </span>
      <div>
        <p className="font-medium text-ink">{titre}</p>
        <p className="mt-1.5 text-ink-soft">{children}</p>
      </div>
    </li>
  );
}

export function MiseEnRoute() {
  return (
    <section className="mt-20">
      <p className="surtitre">// MISE EN ROUTE</p>
      <h2 className="mt-3 max-w-3xl text-2xl sm:text-3xl">
        Ce qu&apos;il touche sur ton disque, avant que tu l&apos;installes.
      </h2>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        <GardeFou
          rang={1}
          titre={
            <>
              Il écoute <code className="font-mono">127.0.0.1</code> uniquement.
            </>
          }
        >
          Ce n&apos;est pas du confort : aucune action n&apos;est authentifiée, donc sur{" "}
          <code className="font-mono">0.0.0.0</code> n&apos;importe qui sur ton réseau pourrait
          réécrire un <code className="font-mono">SKILL.md</code> — c&apos;est-à-dire déposer des
          instructions que Claude Code exécuterait à la session suivante.
        </GardeFou>

        <GardeFou rang={2} titre="La lecture ne touche à rien.">
          Aucun secret n&apos;est ouvert : ni jeton, ni clé d&apos;API, ni contenu de{" "}
          <code className="font-mono">.secrets/</code>.
        </GardeFou>

        <GardeFou rang={3} titre="L'écriture passe trois garde-fous.">
          Avant d&apos;écrire une ligne : hors des racines <code className="font-mono">.claude</code>{" "}
          connues, hors d&apos;un <code className="font-mono">SKILL.md</code>, dans un plugin. Puis
          fichier temporaire et renommage — une session qui lit au même instant ne voit jamais un
          fichier à moitié écrit.
        </GardeFou>

        <GardeFou rang={4} titre="Il refuse d'écrire dans un plugin, et affiche pourquoi.">
          Un plugin est un clone de dépôt : la modification serait écrasée au prochain{" "}
          <code className="font-mono">claude plugin update</code>, en silence.
        </GardeFou>
      </ol>

      <div className="mt-3">
        <ARemplir quoi="distribution — bloque la vente, pas seulement l'affichage">
          <p className="max-w-prose">
            L&apos;installation passe aujourd&apos;hui par un clone du dépôt et{" "}
            <code className="font-mono">npm install</code>. Or le dépôt est <strong>privé</strong>.
            Tant qu&apos;il le reste et qu&apos;aucun paquet n&apos;existe,{" "}
            <strong className="text-amber">
              un acheteur ne peut pas installer ce qu&apos;il vient de payer
            </strong>
            . Ce n&apos;est pas un manque de finition&nbsp;: c&apos;est ce qui interdit
            d&apos;ouvrir la vente.
          </p>
          <p className="max-w-prose">
            Trois sorties possibles, à trancher&nbsp;: rendre le dépôt public et vendre la licence
            d&apos;écriture&nbsp;; publier un paquet npm ou un binaire signé avec son empreinte
            SHA256&nbsp;; ou donner l&apos;accès au dépôt privé après paiement.
          </p>
        </ARemplir>
      </div>
    </section>
  );
}
