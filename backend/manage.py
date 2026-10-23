#!/usr/bin/env python
"""Utilitaire en ligne de commande Django pour project_encheres."""
import os
import sys


def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Impossible d'importer Django. Assurez-vous qu'il est installé et "
            "que votre environnement virtuel est activé."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
