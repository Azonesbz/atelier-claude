import { Inventaire } from "@/components/Inventaire";
import { socle } from "@/lib/page-atelier";

export const dynamic = "force-dynamic";

export default function Page() {
  const { atelier, aDesEtapes } = socle();
  return (
    <main>
      <h1 className="mb-1 text-2xl font-semibold">Agents et commandes</h1>
      <p className="mb-6 max-w-prose text-sm text-muted">Les agents sont choisis par Claude d'après leur description ; les commandes, tapées par toi.</p>
      <Inventaire atelier={atelier} aDesEtapes={aDesEtapes} sections={["agents", "commandes"]} />
    </main>
  );
}
