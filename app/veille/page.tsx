import { Veille } from "@/components/Veille";
import { lireVeille } from "@/lib/lecture/veille";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main>
      <h1 className="mb-6 text-2xl font-semibold">Veille au démarrage</h1>
      <Veille veille={lireVeille()} />
    </main>
  );
}
