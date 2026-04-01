"""
Entrypoint legado (usado pelo .spec do PyInstaller).

Mantemos este arquivo bem pequeno e delegamos tudo para `rpg.py`,
para evitar duplicação e inconsistências entre versões.
"""

from rpg import main


if __name__ == "__main__":
    main()