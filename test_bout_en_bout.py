"""Le hook, exécuté pour de vrai contre un répertoire de configuration isolé.

L'état cassé reproduit ici est celui qui a été observé sur la machine : plugin
déclaré dans `enabledPlugins`, inscrit dans installed_plugins.json, marketplace
résolvable, et `plugins/cache/` absent.

Rien de la configuration réelle n'est lu ni modifié : tout se passe dans un
répertoire temporaire, désigné par CLAUDE_CONFIG_DIR.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RACINE_PROJET = Path(__file__).resolve().parent
PLUGIN = "dev-methodology@claude-config"


def config_isolee(base, chemin_installation):
    """Écrit une configuration déclarant `PLUGIN` installé au chemin donné."""
    (base / "plugins").mkdir(parents=True, exist_ok=True)
    (base / "settings.json").write_text(
        json.dumps({"enabledPlugins": {PLUGIN: True}}), encoding="utf-8"
    )
    (base / "plugins" / "installed_plugins.json").write_text(
        json.dumps({"version": 2, "plugins": {PLUGIN: [{"installPath": chemin_installation}]}}),
        encoding="utf-8",
    )


def lancer_le_hook(base):
    """Exécute hook.py sur cette configuration et rend (code, sortie)."""
    env = dict(os.environ, CLAUDE_CONFIG_DIR=str(base))
    acheve = subprocess.run(
        [sys.executable, str(RACINE_PROJET / "hook.py")],
        env=env, capture_output=True, text=True, timeout=30,
    )
    return acheve.returncode, acheve.stdout


class TestBoutEnBout(unittest.TestCase):
    def test_charge_absente_declenche_un_avertissement(self):
        # Arrange — l'état vécu : tout est déclaré, le répertoire n'existe pas
        with tempfile.TemporaryDirectory() as temporaire:
            base = Path(temporaire)
            config_isolee(base, str(base / "plugins" / "cache" / "absent"))

            # Act
            code, sortie = lancer_le_hook(base)

            # Assert
            self.assertEqual(0, code)
            self.assertIn(PLUGIN, sortie)
            self.assertLessEqual(len(sortie.strip().splitlines()), 4)

    def test_installation_intacte_ne_dit_rien(self):
        # Arrange — même configuration, mais la charge utile est là
        with tempfile.TemporaryDirectory() as temporaire:
            base = Path(temporaire)
            installe = base / "plugins" / "cache" / "present"
            installe.mkdir(parents=True)
            (installe / "plugin.json").write_text("{}", encoding="utf-8")
            config_isolee(base, str(installe))

            # Act
            code, sortie = lancer_le_hook(base)

            # Assert
            self.assertEqual(0, code)
            self.assertEqual("", sortie.strip())

    def test_repertoire_vide_compte_comme_absent(self):
        # Arrange — installation interrompue : le répertoire existe, il est vide
        with tempfile.TemporaryDirectory() as temporaire:
            base = Path(temporaire)
            installe = base / "plugins" / "cache" / "vide"
            installe.mkdir(parents=True)
            config_isolee(base, str(installe))

            # Act
            code, sortie = lancer_le_hook(base)

            # Assert
            self.assertEqual(0, code)
            self.assertIn(PLUGIN, sortie)


if __name__ == "__main__":
    unittest.main()
