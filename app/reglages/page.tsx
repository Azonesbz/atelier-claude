import { Inventaire } from "@/components/Inventaire";
import { socle } from "@/lib/page-atelier";

export const dynamic = "force-dynamic";

export default function Page() {
  const { atelier, aDesEtapes } = socle();
  return (
    <main>
      <h1 className="mb-1 text-2xl font-semibold">Réglages</h1>
      <p className="mb-6 max-w-prose text-sm text-attenue">Les plugins qui apportent du contenu, les hooks qui se déclenchent, les permissions qui autorisent, et les instructions chargées à chaque session.</p>
      <Inventaire atelier={atelier} aDesEtapes={aDesEtapes} sections={["plugins", "hooks", "permissions", "instructions"]} />
    </main>
  );
}
