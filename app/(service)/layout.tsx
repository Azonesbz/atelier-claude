/**
 * La coquille du service : une page publique, pas une application.
 *
 * D'où le contraire des choix de la coquille locale — une colonne centrée qui
 * respire, et le défilement rendu au document. Personne n'« utilise » cette
 * page : on la lit, on décide, on repart.
 */
export default function CoquilleService({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div aria-hidden className="fond-grille" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">{children}</div>
    </div>
  );
}
