import { Cadre } from "./EcranCadre";

/**
 * Ce que la veille écrit au démarrage d'une session — et ce qu'elle écrit le
 * reste du temps, c'est-à-dire rien.
 *
 * Les deux blocs comptent autant l'un que l'autre. Un outil de diagnostic qui
 * parle à chaque session cesse d'être lu au bout d'une semaine : le silence est
 * la fonctionnalité, et il ne se démontre qu'en le montrant.
 *
 * Le chemin affiché est délibérément hors de `plugins/` : un plugin mort ne
 * charge pas ses propres hooks, donc ne peut pas signaler sa mort.
 */
/* 183 et non 362 : `wc -l` sur les six .py du dépôt compte les tests. Le hook
   livré est hook.py + ecart.py + lecture.py + message.py. Un chiffre faux
   devant un public qui clone et compte coûte plus cher que pas de chiffre. */
const MESURES = ["183 lignes", "aucune dépendance", "stdlib seule"];

const ALERTE = `dev-methodology@claude-config est déclaré actif,
et son installPath n'existe pas sur le disque :
~/.claude/plugins/cache/claude-config

Ses 16 compétences ne chargeront pas cette session.`;

export function EcranVeille() {
  return (
    <Cadre chemin="~/.claude/hooks/veille-orcha.py" etiquette="SessionStart">
      <ul className="mb-4 flex flex-wrap gap-1.5">
        {MESURES.map((mesure) => (
          <li key={mesure} className="chip font-mono">
            {mesure}
          </li>
        ))}
      </ul>

      <p className="mb-2 text-xs text-muted">Au démarrage d&apos;une session, s&apos;il trouve un écart :</p>
      <pre className="overflow-x-auto rounded border border-line bg-paper p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
        <span className="text-danger">orcha — 1 écart</span>
        {`\n\n${ALERTE}`}
      </pre>

      <p className="mt-4 mb-2 text-xs text-muted">Le reste du temps :</p>
      <pre className="overflow-x-auto rounded border border-line bg-paper p-3 font-mono text-[11px] text-muted">
        aucune sortie — le hook se tait
      </pre>
    </Cadre>
  );
}
