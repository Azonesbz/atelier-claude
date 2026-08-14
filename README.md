# Atelier Claude

Voir et modifier un dossier `.claude` sur une page. Interface locale, aucun
compte, aucune base, rien qui sorte de la machine.

```bash
npm install
npm run dev
```

http://localhost:4300

## Ce que ça montre

Tout ce qui est chargé, avec sa provenance : compétences, agents, commandes,
hooks, permissions, plugins, fichiers d'instructions. Chaque ligne porte sa
portée — `~/.claude`, le projet, ou un plugin nommé.

Et surtout ce qui est **présent mais sans effet**, la seule chose qu'aucune
commande intégrée ne dit :

| Écart | Règle de détection |
| --- | --- |
| Plugin déclaré, charge utile absente | `enabledPlugins` × `installed_plugins.json` × existence de `installPath` |
| Plugin déclaré, aucune installation | déclaré actif, rien dans `installed_plugins.json` |
| Agent ou commande sans description | le modèle n'a rien pour décider de s'en servir |
| Frontmatter ni lisible en YAML ni en `clé: valeur` | l'élément est ignoré sans un mot |
| Hook à la commande vide | déclaré, n'exécute rien |
| Matcher au mauvais type | invalide le fichier de réglages **entier** |

Deux choses ne sont **pas** comptées comme des écarts, chacune parce qu'un test
contrôlé sur 2.1.227 l'a démenti :

- `disable-model-invocation: true` — c'est un choix, pas une panne. La liste
  l'affiche sans le peindre en rouge.
- un `name` de frontmatter différent du nom de répertoire ou de fichier — un
  répertoire `repertoire-aaa` portant `name: frontmatter-zzz` se présente sous
  `frontmatter-zzz`, et un agent `fichier-bbb.md` portant
  `name: frontmatter-yyy` sous `frontmatter-yyy`. C'est le `name` qui fait
  l'identité, la divergence ne casse rien.

## Ce que ça modifie

Les compétences de `~/.claude` et du projet : description, indice d'argument,
corps. Écriture par fichier temporaire puis renommage, pour qu'une session qui
lit au même instant ne voie jamais un fichier à moitié écrit.

Trois refus, dans cet ordre : hors des racines connues, hors d'un `SKILL.md`,
**dans un plugin** — un plugin est un clone de dépôt, le modifier serait écrasé
au prochain `claude plugin update`, sans avertissement.

## La règle qui gouverne tout le code

**Ne jamais re-sérialiser le YAML.** Le frontmatter est réécrit ligne à ligne :
seules les clés modifiées bougent, le reste ressort octet pour octet.

La raison est concrète. `~/.claude/skills/halo/SKILL.md` contient
`argument-hint: [step] <demande en langage naturel>`, que YAML strict refuse —
`[step]` est lu comme une séquence en flot, puis le texte qui suit surprend
l'analyseur. Claude Code, lui, charge ce fichier sans broncher. Une première
version de cet outil déclarait donc `halo` morte, à tort ; un test contrôlé sur
2.1.227 (quatre compétences en configuration isolée) a montré que seul
`disable-model-invocation: true` la retirait de la liste.

**Un outil qui annonce une panne inexistante est pire que pas d'outil.** La
lecture tente YAML strict, retombe sur une lecture ligne à ligne, et ne déclare
illisible que si les deux échouent.

## Le hook de veille

Le même écart de plugins, sans ouvrir l'interface. Un hook `SessionStart`
déclaré dans `~/.claude/settings.json`, **hors de tout plugin** — un plugin mort
ne charge pas ses propres hooks, donc ne peut pas signaler sa mort.

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

29 ms par passage, aucune dépendance. Il se tait quand tout va bien. Sa sortie
alimente le contexte de session : en session interactive elle s'affiche en tête,
sous « SessionStart hook ».

Il ne doit **jamais** appeler `claude plugin list` — cette commande repeuple
`installPath` depuis le clone de la marketplace avant d'afficher, et répare donc
ce qu'elle prétend mesurer.

## Tests

```bash
npm test && npm run test:hook
```

Quatorze tests TypeScript, huit Python. Les cas les plus utiles sont des
régressions payées : la ligne de `halo` qui doit ressortir intacte après
modification d'une autre ligne, et le refus d'écrire dans un plugin.

## Structure

| Chemin | Rôle |
| --- | --- |
| `lib/lecture/` | Lire le disque : `fichiers`, `competences`, `documents`, `reglages`, `plugins`, `atelier` |
| `lib/ecriture/` | Réécrire sans casser : `frontmatter`, `competence` |
| `app/` | L'interface : liste, puis détail modifiable par compétence |
| `hook.py`, `ecart.py`, `lecture.py`, `message.py` | Le hook de veille, indépendant du web |

## Limites

- **L'état effectif complet n'est pas calculable depuis le disque.** Une couche
  de réglages administrés est délivrée à distance à la connexion, à quoi
  s'ajoutent les arguments CLI, l'environnement et `--settings`. L'outil dit
  « voici un écart certain », jamais « voici tout ».
- **Seules les compétences sont modifiables.** Agents, commandes, hooks et
  permissions sont en lecture seule pour l'instant.
- **La précédence n'est pas calculée.** Quand deux éléments de même nom
  existent dans deux portées, l'un éclipse l'autre en silence. C'est le plus
  gros écart encore non détecté, et le prochain à écrire.
- **Le chemin du hook est en dur** dans le bloc ci-dessus. Outil interne.
