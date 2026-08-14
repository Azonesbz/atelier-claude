#!/usr/bin/env python3
"""Hook SessionStart : prévenir quand une extension déclarée ne chargera pas.

Se déclare dans `~/.claude/settings.json`, **hors de tout plugin**. Un plugin
mort ne charge pas ses propres hooks : il ne peut donc pas signaler sa mort.
C'est la seule raison pour laquelle ce script existe à l'extérieur.

Il ne modifie rien, n'appelle aucun service, ne lit aucun secret. Il lit trois
fichiers JSON, vérifie l'existence de répertoires, et se tait s'il n'a rien à
dire.
"""

import sys

from ecart import ecarts
from lecture import declares, installations, presence, racine
from message import rendu


def main():
    """Écrit l'avertissement sur la sortie standard, ou rien du tout."""
    base = racine()
    trouves = ecarts(declares(base), installations(base), presence)
    avertissement = rendu(trouves)
    if avertissement:
        print(avertissement)
    return 0


if __name__ == "__main__":
    sys.exit(main())
