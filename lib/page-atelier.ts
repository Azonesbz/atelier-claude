import { lireAtelier } from "@/lib/lecture/atelier";
import { aDesEtapes } from "@/lib/lecture/workflow";

/** Ce que chaque route de liste a besoin de savoir. Lu une fois par requête. */
export function socle() {
  const atelier = lireAtelier();
  return {
    atelier,
    aDesEtapes: atelier.competences.filter((c) => aDesEtapes(c.corps)).map((c) => c.chemin),
  };
}
