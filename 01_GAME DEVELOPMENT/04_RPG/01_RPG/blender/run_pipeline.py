# -*- coding: utf-8 -*-
"""Blender + Python: characters, buildings, props → OBJ/FBX."""

from __future__ import annotations

import sys
from pathlib import Path

GEN = Path(__file__).resolve().parent / "generation"
sys.path.insert(0, str(GEN))

from generate_building import run as buildings  # noqa: E402
from generate_character import run as character  # noqa: E402
from generate_prop import run as props  # noqa: E402

SEED = (
    ("amaterasu", "assets/characters/yamato/amaterasu.png"),
    ("athena", "assets/characters/hellas/athena.png"),
    ("anubis", "assets/characters/kemet/anubis.png"),
    ("ishtar", "assets/characters/mesopotamia/ishtar.png"),
    ("scathach", "assets/characters/celtic/scathach.png"),
    ("edo", "assets/characters/tokyo/edo.png"),
)


def run():
    for name, portrait in SEED:
        character(name, portrait)
    buildings(8)
    props()
    print("blender pipeline done")


if __name__ == "__main__":
    run()
