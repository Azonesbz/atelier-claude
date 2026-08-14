"""Tests de la règle d'écart — le cœur du produit.

Aucun accès au disque : la présence d'un chemin est injectée. Ces tests
décrivent les trois situations que le hook doit savoir distinguer.
"""

import unittest

from ecart import CHARGE_ABSENTE, SANS_INSTALLATION, ecarts


def presence_totale(_chemin):
    """Tout chemin existe et contient quelque chose."""
    return True


def presence_nulle(_chemin):
    """Aucun chemin n'existe — le cas vécu du 16 juillet au 13 août 2026."""
    return False


class TestEcarts(unittest.TestCase):
    def test_configuration_saine_ne_produit_aucun_ecart(self):
        # Arrange
        declares = {"dev-methodology@claude-config": True}
        installations = {"dev-methodology@claude-config": [{"installPath": "/un/chemin"}]}

        # Act
        resultat = ecarts(declares, installations, presence_totale)

        # Assert
        self.assertEqual([], resultat)

    def test_charge_utile_absente_du_disque_est_signalee(self):
        # Arrange — le plugin est déclaré, inscrit, mais son répertoire a disparu
        declares = {"dev-methodology@claude-config": True}
        installations = {"dev-methodology@claude-config": [{"installPath": "/parti"}]}

        # Act
        resultat = ecarts(declares, installations, presence_nulle)

        # Assert
        self.assertEqual(1, len(resultat))
        self.assertEqual(CHARGE_ABSENTE, resultat[0].genre)
        self.assertEqual("/parti", resultat[0].chemin)

    def test_plugin_declare_sans_aucune_trace_d_installation_est_signale(self):
        # Arrange — le mécanisme inverse, celui du ticket #83422
        declares = {"fantome@quelque-part": True}
        installations = {}

        # Act
        resultat = ecarts(declares, installations, presence_totale)

        # Assert
        self.assertEqual(1, len(resultat))
        self.assertEqual(SANS_INSTALLATION, resultat[0].genre)

    def test_plugin_desactive_est_ignore(self):
        # Arrange — désactivé volontairement : ce n'est pas une panne
        declares = {"repose@claude-config": False}
        installations = {}

        # Act
        resultat = ecarts(declares, installations, presence_nulle)

        # Assert
        self.assertEqual([], resultat)

    def test_chaque_installation_cassee_est_signalee_separement(self):
        # Arrange — un même plugin installé dans deux portées, une seule cassée
        declares = {"double@claude-config": True}
        installations = {
            "double@claude-config": [{"installPath": "/vivant"}, {"installPath": "/mort"}]
        }

        # Act
        resultat = ecarts(declares, installations, lambda chemin: chemin == "/vivant")

        # Assert
        self.assertEqual(1, len(resultat))
        self.assertEqual("/mort", resultat[0].chemin)


if __name__ == "__main__":
    unittest.main()
