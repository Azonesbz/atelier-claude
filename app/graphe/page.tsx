import Link from "next/link";
import { GrapheReseau } from "@/components/graphe/GrapheReseau";
import { lireAtelier } from "@/lib/lecture/atelier";
import { construireGraphe } from "@/lib/lecture/graphe";

export const dynamic = "force-dynamic";

export default function PageGraphe() {
  const graphe = construireGraphe(lireAtelier());

  return (
    <main>
      <Link href="/" className="text-sm text-attenue underline-offset-2 hover:underline">
        ← la liste
      </Link>
      <header className="mt-4 mb-4">
        <h1 className="text-2xl font-semibold">Le réseau</h1>
        <p className="mt-1 text-sm text-attenue">
          Une arête relie deux fichiers quand l&apos;un nomme l&apos;autre et que ce nom
          correspond à quelque chose de réellement présent sur le disque. Ce n&apos;est pas un
          graphe d&apos;exécution : Claude Code n&apos;en exécute pas.
        </p>
      </header>
      <GrapheReseau graphe={graphe} />
    </main>
  );
}
