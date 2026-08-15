"use server";

import { revalidatePath } from "next/cache";
import { enregistrerCle, retirerLicence } from "@/lib/licence/etat";

export interface RetourLicence {
  etat: "vierge" | "fait" | "refuse";
  message: string;
}

export async function enregistrer(
  _precedent: RetourLicence,
  formulaire: FormData,
): Promise<RetourLicence> {
  const cle = String(formulaire.get("cle") ?? "").trim();
  if (!cle) {
    retirerLicence();
    revalidatePath("/", "layout");
    return { etat: "fait", message: "Licence retirée. L'outil repasse en lecture seule." };
  }
  if (!cle.startsWith("AC-")) {
    return { etat: "refuse", message: "Une clé commence par « AC- »." };
  }

  enregistrerCle(cle);
  revalidatePath("/", "layout");
  return { etat: "fait", message: "Clé enregistrée. Vérification auprès du service…" };
}
