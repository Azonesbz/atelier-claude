"""Lecture des fichiers de configuration locaux. Rien d'autre n'est touché.

AVERTISSEMENT DE CONCEPTION — ne jamais passer par `claude plugin list` pour
savoir si un plugin est installé. Cette commande repeuple `installPath` depuis
le clone de la marketplace **avant** d'afficher son résultat : elle répare ce
qu'on cherche à mesurer, puis annonce « enabled » sans un mot sur la réparation.

Vérifié le 14 août 2026 sur Claude Code 2.1.227, en configuration isolée :
cache absent → commande lancée → cache présent (27 fichiers), stderr vide,
code de retour 0, aucune clé `errors` dans la sortie JSON.
"""

import json
import os
from pathlib import Path

FICHIERS_DE_REGLAGES = ("settings.json", "settings.local.json")


def racine():
    """Le répertoire de configuration en vigueur, isolable pour les tests."""
    depuis_env = os.environ.get("CLAUDE_CONFIG_DIR")
    return Path(depuis_env) if depuis_env else Path.home() / ".claude"


def declares(base):
    """`enabledPlugins`, fusionné dans l'ordre de précédence des réglages."""
    fusion = {}
    for nom in FICHIERS_DE_REGLAGES:
        fusion.update(_json(base / nom).get("enabledPlugins") or {})
    return fusion


def installations(base):
    """Le contenu de `plugins` dans installed_plugins.json."""
    inscrit = _json(base / "plugins" / "installed_plugins.json")
    return inscrit.get("plugins") or {}


def presence(chemin):
    """Vrai si le chemin est un répertoire contenant au moins un fichier.

    Un répertoire vide compte comme absent : c'est un reste d'installation
    interrompue, et Claude Code ne chargera rien de plus qu'avec rien du tout.
    """
    if not chemin:
        return False
    repertoire = Path(chemin)
    if not repertoire.is_dir():
        return False
    return any(entree.is_file() for entree in repertoire.rglob("*"))


def _json(chemin):
    """Le contenu d'un fichier JSON, ou un dictionnaire vide s'il est illisible.

    Un fichier absent est normal (settings.local.json l'est souvent). Un fichier
    corrompu n'est pas notre sujet : `claude doctor` le signale déjà, nommément.
    """
    try:
        return json.loads(Path(chemin).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
