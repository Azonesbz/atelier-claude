/**
 * Les trois réducteurs de risque, développés — avant la première démonstration.
 *
 * Le triplet collé sous le bouton du héros les nomme ; ici on les prouve, et on
 * s'arrête là. C'est l'ordre observé chez les vendeurs sans notoriété du panel :
 * le doute sur ce que l'outil fait de tes fichiers se lève avant qu'on demande
 * de regarder quoi que ce soit, sinon il occupe toute la lecture.
 *
 * EMPLACEMENT — garantie de remboursement. Les pages qui vendent le mieux dans
 * cette niche répètent une garantie près du bouton. Aucune politique de
 * remboursement n'existe pour Orcha : tant qu'elle n'est pas écrite, il n'y a
 * pas de quatrième carte. On ne promet pas un délai qu'on n'a pas décidé.
 */
const PROMESSES: Array<{ titre: string; corps: React.ReactNode }> = [
  {
    titre: "Achat unique.",
    corps: "Une fois, pas par mois. Mises à jour comprises, à vie.",
  },
  {
    titre: "Rien ne sort de ta machine.",
    corps: (
      <>
        Le serveur n&apos;écoute que <code>127.0.0.1</code>. Le service de licence ne sait
        qu&apos;une chose : si ton achat existe.
      </>
    ),
  },
  {
    titre: "La lecture est entière et gratuite.",
    corps: "L'inventaire, les écarts, les plans, la veille. Sans compte.",
  },
];

export function Reassurance() {
  return (
    <section id="reassurance" className="mt-6 grid scroll-mt-4 gap-3 sm:grid-cols-3">
      {PROMESSES.map((promesse) => (
        <div key={promesse.titre} className="card p-5">
          <h2 className="text-base font-semibold text-balance">{promesse.titre}</h2>
          <p className="mt-2 text-sm text-muted">{promesse.corps}</p>
        </div>
      ))}
    </section>
  );
}
