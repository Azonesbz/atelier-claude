import { Rail } from "@/components/Rail";

/**
 * La coquille de l'application locale.
 *
 * Ce n'est pas un site : `h-dvh` et `overflow-hidden` au corps, une seule zone
 * qui défile, le chrome fixe. La colonne centrée à grandes marges d'un site
 * gaspillerait la fenêtre — et ne survivrait pas à un empaquetage en logiciel,
 * où l'application occupe ce qu'on lui donne.
 *
 * Le rail vit ici et non à la racine : les pages du service sont publiques, et
 * « Compétences » ou « Workflows » n'y veulent rien dire.
 */
export default function CoquilleLocale({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <Rail />
      <div className="relative min-w-0 flex-1 overflow-y-auto">
        <div aria-hidden className="fond-grille" />
        {/* Une application occupe ce qu'on lui donne. La borne haute évite
            seulement les lignes à rallonge sur un très grand écran. */}
        <div className="relative z-10 mx-auto max-w-[100rem] px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
