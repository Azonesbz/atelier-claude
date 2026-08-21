import { AppelPrincipal, AppelSecondaire, Reducteurs } from "./Appel";

/**
 * Le dernier point de décision — même bouton, même libellé qu'en haut.
 *
 * Rien de neuf n'est promis ici : le lecteur qui arrive au bas de page a tout
 * lu, y compris les limites, et un argument inédit à cet endroit sentirait la
 * relance. Reste à rendre la sortie facile dans les deux sens — acheter, ou
 * installer et lire — et à remettre les trois réducteurs de risque au contact
 * du bouton, seul endroit où le local-first vend quelque chose.
 */

export function AppelFinal() {
  return (
    <section className="card mt-20 border-line-strong p-6 sm:p-10">
      <h2 className="text-2xl sm:text-3xl">Tu sauras ce qui tourne vraiment.</h2>
      <p className="mt-3 max-w-prose text-ink-soft">
        Installe-le, lis tout, gratuitement. Achète quand tu voudras modifier.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <AppelPrincipal />
        <AppelSecondaire />
      </div>

      <Reducteurs />
    </section>
  );
}
