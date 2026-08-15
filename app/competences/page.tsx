import { Inventaire } from "@/components/Inventaire";
import { socle } from "@/lib/page-atelier";

export const dynamic = "force-dynamic";

export default function Page() {
  const { atelier, aDesEtapes } = socle();
  return (
    <main>
      <h1 className="mb-1 text-2xl font-semibold">Compétences</h1>
      <p className="mb-6 max-w-prose text-sm text-attenue">Ce que Claude peut charger, et d'où ça vient. Clique un nom pour le modifier.</p>
      <Inventaire atelier={atelier} aDesEtapes={aDesEtapes} sections={["competences"]} />
    </main>
  );
}
