"use server";

import { revalidatePath } from "next/cache";
import { oublierSession } from "@/lib/acces/session";

/**
 * Se déconnecter : le fichier de session part, l'écriture se referme.
 *
 * Rien n'est révoqué côté fournisseur. C'est délibéré — la machine oublie, le
 * compte reste, et se reconnecter rouvre l'écriture sans repasser à la caisse.
 */
export async function deconnecter(): Promise<void> {
  oublierSession();
  revalidatePath("/", "layout");
}
