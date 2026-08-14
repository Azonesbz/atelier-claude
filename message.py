"""Le message : quatre lignes au maximum, et le silence quand tout va bien.

Un avertissement qui parle trop devient un avertissement qu'on ne lit plus.
C'est précisément parce que rien n'a parlé pendant un mois que celui-ci doit
rester rare — donc bref, donc crédible.
"""

from ecart import CHARGE_ABSENTE

ENTETE = "⚠  Extensions déclarées actives que Claude Code ne chargera pas :"
REMEDE = "   Réparer : claude plugin install <nom>@<marketplace>"

#: Entête et remède occupent deux des quatre lignes promises.
DETAILS_MAX = 2


def rendu(trouves):
    """Rend l'avertissement, ou une chaîne vide s'il n'y a rien à dire."""
    if not trouves:
        return ""

    lignes = [ENTETE]
    lignes.extend(_ligne(ecart) for ecart in trouves[:DETAILS_MAX])
    reste = len(trouves) - DETAILS_MAX
    if reste > 0:
        lignes[-1] = f"   … et {reste + 1} autres extensions dans le même cas"
    lignes.append(REMEDE)
    return "\n".join(lignes)


def _ligne(ecart):
    """Une extension, une ligne, la cause en clair."""
    if ecart.genre == CHARGE_ABSENTE:
        return f"   {ecart.plugin} — répertoire d'installation absent ou vide"
    return f"   {ecart.plugin} — aucune installation enregistrée"
