#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UE = ROOT / "game" / "unreal" / "Content" / "Data"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    chars = load(UE / "characters.json")
    relics = load(UE / "relics.json")
    civs = load(UE / "civilizations.json")
    dialogue = load(ROOT / "data" / "dialogue.json")
    enemies = load(ROOT / "data" / "enemies.json")
    tokyo = load(ROOT / "data" / "maps" / "tokyo_ruins.json")
    trailer = load(ROOT / "trailer" / "trailer.json")
    ama = next(c for c in chars if c["id"] == "amaterasu_001")
    assert ama["civilization"] == "japan"
    assert ama["relic"] == "yata_mirror"
    assert ama["skills"] == ["solar_slash", "sakura_domain", "eternal_sun"]
    assert any(r["id"] == "yata_mirror" for r in relics)
    assert {c["id"] for c in civs} >= {"japan", "greece", "egypt", "norse", "mesopotamia"}
    seed = {row["character"] for row in dialogue}
    assert seed >= {"amaterasu", "athena", "anubis", "ishtar", "scathach"}
    assert any(e["id"] == "lost_memory" for e in enemies)
    assert tokyo["base"] == "forgotten"
    assert tokyo["enemy"] == "lost_memory"
    assert trailer["duration"] == 30
    assert [s.get("id") for s in trailer["shots"] if "id" in s][:3] == [
        "AmaterasuAwakening",
        "RelicActivation",
        "MemoryWave",
    ]
    print("PROTOTYPE DATA OK", len(chars), "seed characters", len(dialogue), "lines")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
