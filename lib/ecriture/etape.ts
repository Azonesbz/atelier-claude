/**
 * Ajouter une étape à un workflow, des deux côtés à la fois.
 *
 * Une étape n'existe que si son fichier est là ET si le tableau `## Séquence`
 * l'appelle. Écrire l'un sans l'autre fabrique exactement l'écart que cet outil
 * sert à détecter — on écrit donc les deux, et on défait le premier si le
 * second échoue.
 */

import { unlinkSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { lireTexte } from "../lecture/fichiers.ts";
import type { Workflow } from "../lecture/workflow.ts";
import { cheminModifiable, doitEtreLibre, EcritureRefusee, ecrireAtomiquement, enSlug } from "./garde.ts";

export interface Convention {
  /** `steps` chez halo, `etapes` chez lancer. */
  dossier: string;
  /** `step` ou `etape`, le préfixe des noms de fichiers. */
  prefixe: string;
  /** Largeur du numéro : 2 pour `00`. */
  largeur: number;
  prochainNumero: string;
}

/**
 * Déduit la convention du workflow au lieu d'en imposer une.
 *
 * `halo` écrit `steps/step-00-init.md`, `lancer` écrit
 * `etapes/etape-00-reconnaissance.md`. Les deux ont raison chez eux.
 */
export function conventionDe(workflow: Workflow): Convention {
  const derniere = workflow.etapes.at(-1);
  if (!derniere) throw new EcritureRefusee("Ce workflow n'a aucune étape à imiter.");

  const dossier = dirname(derniere.fichierDeclare);
  const nom = basename(derniere.fichierDeclare, ".md");
  const decoupe = /^(.*?)-(\d+)-/.exec(nom);
  if (!decoupe) throw new EcritureRefusee(`Nom d'étape inattendu : « ${nom} ».`);

  const largeur = decoupe[2].length;
  const maximum = Math.max(...workflow.etapes.map((e) => Number(e.numero)));
  return {
    dossier,
    prefixe: decoupe[1],
    largeur,
    prochainNumero: String(maximum + 1).padStart(largeur, "0"),
  };
}

export interface NouvelleEtape {
  titre: string;
  sortieAttendue: string;
}

/** Crée le fichier d'étape et ajoute sa ligne au tableau. Rend le chemin écrit. */
export function ajouterEtape(cheminSkill: string, workflow: Workflow, etape: NouvelleEtape): string {
  const absolu = cheminModifiable(cheminSkill);
  const convention = conventionDe(workflow);

  const titre = etape.titre.trim();
  if (!titre) throw new EcritureRefusee("Une étape sans titre ne se lit pas.");
  const slug = enSlug(titre);
  if (!slug) throw new EcritureRefusee(`« ${titre} » ne donne aucun nom de fichier utilisable.`);

  const relatif = `${convention.dossier}/${convention.prefixe}-${convention.prochainNumero}-${slug}.md`;
  const cheminEtape = join(dirname(absolu), relatif);
  cheminModifiable(cheminEtape);
  doitEtreLibre(cheminEtape);

  const skill = lireTexte(absolu);
  if (skill === null) throw new EcritureRefusee("Le SKILL.md est introuvable.");

  ecrireAtomiquement(cheminEtape, squelette(convention.prochainNumero, titre, etape.sortieAttendue));
  try {
    ecrireAtomiquement(absolu, avecLigneAjoutee(skill, convention.prochainNumero, relatif, etape.sortieAttendue));
  } catch (erreur) {
    // Le fichier seul serait un orphelin : on préfère ne rien laisser.
    unlinkSync(cheminEtape);
    throw erreur;
  }
  return cheminEtape;
}

function squelette(numero: string, titre: string, sortie: string): string {
  return [
    `# Étape ${numero} — ${titre}`,
    "",
    `**Sortie attendue** : ${sortie.trim() || "à écrire."}`,
    "",
    "## Ce que tu fais",
    "",
    "À écrire.",
    "",
  ].join("\n");
}

const LIGNE_ETAPE = /^\|\s*\d+\s*\|\s*[^|]*`[^`]+\.md`[^|]*\|/;

/**
 * Insère la ligne juste après la dernière ligne d'étape du tableau.
 *
 * On ne réécrit pas le tableau : on y ajoute une ligne. Le reste du fichier,
 * séparateurs et alignements compris, ressort octet pour octet.
 */
function avecLigneAjoutee(skill: string, numero: string, relatif: string, sortie: string): string {
  const lignes = skill.split("\n");
  let derniere = -1;
  for (let i = 0; i < lignes.length; i++) {
    if (LIGNE_ETAPE.test(lignes[i])) derniere = i;
  }
  if (derniere === -1) throw new EcritureRefusee("Aucun tableau d'étapes n'a été trouvé dans ce SKILL.md.");

  const role = sortie.trim().replace(/\|/g, "\\|") || "À écrire";
  lignes.splice(derniere + 1, 0, `| ${numero} | \`${relatif}\` | ${role} |`);
  return lignes.join("\n");
}
