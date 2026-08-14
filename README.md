# Atelier Claude

Prévient, au démarrage d'une session Claude Code, quand une extension déclarée
active **ne chargera pas**. Le reste du temps, il se tait.

## Pourquoi

Le 14 juillet 2026, le plugin `dev-methodology@claude-config` a été installé et
activé. Sa charge utile a ensuite disparu du disque. Du 16 juillet au 13 août,
il est resté inscrit dans `enabledPlugins` **et** dans `installed_plugins.json`,
sans jamais charger. Mesure sur 1 057 transcriptions : 1 seule sur 976 mentionne
`dev-methodology:` avant le 14 août, contre 51 sur 81 depuis.

Rien ne l'a signalé pendant un mois. Vérifié sur Claude Code 2.1.227, en
configuration isolée :

| | cache absent | cache présent |
| --- | --- | --- |
| le plugin charge | **non** (0 compétence dans `/context`) | oui (16 entrées) |
| avertissement sur stderr | **aucun** | aucun |
| code de retour | 0 | 0 |

`claude doctor` ne regarde pas les plugins. `/doctor` exclut explicitement les
erreurs de chargement et ne mesure que l'usage — devant un plugin mort, qui
compte zéro invocation par construction, il aurait recommandé de le désactiver.

## Deux contraintes, découvertes par l'expérience

**Le détecteur ne doit jamais appeler `claude plugin list`.** Cette commande
repeuple `installPath` depuis le clone de la marketplace *avant* d'afficher son
résultat : elle répare ce qu'elle prétend mesurer, puis annonce « enabled »
sans un mot. C'est ainsi que la panne d'origine a été effacée en cours
d'enquête. Ce projet lit le disque, directement.

**Le détecteur ne peut pas vivre dans un plugin.** Un plugin mort ne charge pas
ses propres hooks, donc ne peut pas signaler sa mort. Il faut se déclarer dans
`~/.claude/settings.json`, à l'extérieur.

## Installation

Ajouter dans `~/.claude/settings.json` :

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 /Users/vins/idea/projects/atelier-claude/hook.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Si la clé `hooks` existe déjà, fusionner le tableau `SessionStart` plutôt que
de le remplacer.

Aucune dépendance : `python3`, présent sur macOS. 29 ms par passage.

**Où le message apparaît.** Le hook se déclenche aussi bien en mode `-p` qu'en
session interactive — vérifié le 14 août 2026 par un hook-marqueur écrivant un
fichier. Sa sortie alimente le contexte de session plutôt que le terminal : en
session interactive, elle s'affiche en tête sous « SessionStart hook ». En
mode `-p`, elle n'est pas imprimée, mais elle est bien transmise.

## Essayer sans rien installer

```bash
python3 hook.py
```

Silence si tout va bien. Pour voir l'avertissement, reconstruire un état cassé
dans un répertoire jetable — c'est ce que fait `test_bout_en_bout.py`.

## Tests

```bash
python3 -m unittest discover -p 'test_*.py' -v
```

Huit tests. `test_ecart.py` couvre la règle sans toucher au disque ;
`test_bout_en_bout.py` exécute le hook contre des configurations isolées, dont
l'état cassé observé sur la machine.

## Ce que ça ne fait pas

- **Ça ne répare rien.** Le message nomme la commande de réparation ; c'est tout.
- **Ça ne dit pas l'état effectif complet.** Une couche de réglages administrés
  est délivrée à distance à la connexion, sans aucun fichier local, à quoi
  s'ajoutent les arguments CLI, l'environnement et `--settings`. Un outil qui
  lit le disque ne peut pas prétendre à l'exhaustivité. Il dit seulement :
  « voici un écart certain ».
- **Ça ne couvre que les plugins.** Les compétences, hooks, agents et serveurs
  MCP ont leurs propres modes de panne muette, non traités ici.

## Structure

| Fichier | Rôle |
| --- | --- |
| `ecart.py` | La règle : soustraire le présent du déclaré. Aucun accès au disque. |
| `lecture.py` | Lecture des trois fichiers de configuration. |
| `message.py` | Le rendu, quatre lignes au maximum. |
| `hook.py` | Le point d'entrée appelé par Claude Code. |

## Limite connue

Le trou exploité ici est un bug, et Anthropic referme activement cette classe
de défauts : cinq des sept tickets recensés sont déjà fermés. Le précédent
existe dans le produit — une règle de permission sans effet provoque déjà un
avertissement spontané au démarrage. Le jour où ce mécanisme est étendu aux
plugins, ce dépôt n'a plus de raison d'être. C'est le résultat souhaitable.
