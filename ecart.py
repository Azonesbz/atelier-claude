"""La règle : soustraire ce qui est présent sur le disque de ce qui est déclaré.

Domaine pur. La présence d'un chemin arrive par injection, jamais par un appel
au système de fichiers — c'est ce qui rend la règle testable sans reconstruire
une arborescence, et c'est aussi ce qui permet de la relire sans rien exécuter.
"""

from dataclasses import dataclass

#: Déclaré actif, mais aucune trace dans installed_plugins.json.
SANS_INSTALLATION = "sans_installation"

#: Inscrit comme installé, mais son répertoire est absent ou vide.
CHARGE_ABSENTE = "charge_absente"


@dataclass(frozen=True)
class Ecart:
    """Un plugin déclaré actif que Claude Code ne chargera pas."""

    plugin: str
    genre: str
    chemin: str


def ecarts(declares, installations, presence):
    """Liste les plugins déclarés actifs qui ne chargeront pas.

    `declares` vient de settings.json (`enabledPlugins`), `installations` de
    installed_plugins.json, et `presence(chemin)` répond si un répertoire
    existe et contient quelque chose.

    Une liste vide veut dire que tout ce qui est déclaré est là. C'est le cas
    normal, et le hook se tait alors complètement.
    """
    trouves = []
    for plugin, actif in sorted(declares.items()):
        if not actif:
            continue
        trouves.extend(_ecarts_du_plugin(plugin, installations.get(plugin), presence))
    return trouves


def _ecarts_du_plugin(plugin, entrees, presence):
    """Les écarts d'un seul plugin : aucune installation, ou charge absente."""
    if not entrees:
        return [Ecart(plugin, SANS_INSTALLATION, "")]

    manquants = []
    for entree in entrees:
        chemin = entree.get("installPath", "")
        if not presence(chemin):
            manquants.append(Ecart(plugin, CHARGE_ABSENTE, chemin))
    return manquants
