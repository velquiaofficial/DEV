#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validate PROJECT AETERNA character JSON against the Master Plan schema."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
SCHEMA_KEYS = [
    "id",
    "name_ja",
    "name_en",
    "era",
    "civilization",
    "class",
    "role",
    "element",
    "weapon",
    "height",
    "appearance",
    "stats",
    "skills",
    "normal_attack",
    "skill_1",
    "skill_2",
    "ultimate",
    "passive",
    "civilization_tags",
    "relationships",
    "voice_type",
    "music_theme",
    "civilization_shift_effect",
]
ERAS = {"MYTH", "ANCIENT", "MEDIEVAL", "EARLY MODERN", "MODERN", "CONTEMPORARY", "FUTURE", "VOID"}
ROLES = {"ATTACKER", "DEFENDER", "SUPPORT", "CONTROLLER", "TACTICIAN", "ASSASSIN", "SUPPORT_ATTACKER"}
CLASSES = {"DIVINE", "MYTH", "LEGEND", "LEGACY", "NEXUS", "ANTAGONIST"}
FOUNDERS = {"amaterasu", "athena", "isis", "roma", "xishi", "edo"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    errors = []
    chars_dir = DATA / "characters"
    civ_dir = DATA / "civilizations"
    if not chars_dir.exists():
        print("missing", chars_dir)
        return 1

    civ_codes = set()
    civ_ids = set()
    for path in sorted(civ_dir.glob("*.json")):
        civ = load_json(path)
        civ_ids.add(civ.get("id"))
        civ_codes.add(civ.get("code"))

    characters = []
    seen = set()
    skill_ids = set()
    weapon_ids = set()
    for path in sorted(chars_dir.glob("*.json")):
        ch = load_json(path)
        characters.append(ch)
        cid = ch.get("id")
        if cid in seen:
            errors.append("duplicate id: %s" % cid)
        seen.add(cid)
        for key in SCHEMA_KEYS:
            if key not in ch:
                errors.append("%s missing %s" % (cid, key))
        if ch.get("era") not in ERAS:
            errors.append("%s bad era %s" % (cid, ch.get("era")))
        if ch.get("role") not in ROLES:
            errors.append("%s bad role %s" % (cid, ch.get("role")))
        if ch.get("class") not in CLASSES:
            errors.append("%s bad class %s" % (cid, ch.get("class")))
        if ch.get("civilization") not in civ_codes:
            errors.append("%s unknown civilization %s" % (cid, ch.get("civilization")))
        stats = ch.get("stats") or {}
        for stat in ("hp", "attack", "defense", "speed"):
            value = stats.get(stat)
            if not isinstance(value, (int, float)):
                errors.append("%s missing stat %s" % (cid, stat))
            elif value <= 0 or value > 3000:
                errors.append("%s abnormal stat %s=%s" % (cid, stat, value))
        appearance = ch.get("appearance") or {}
        for key in ("hair", "eyes", "costume"):
            if not appearance.get(key):
                errors.append("%s missing appearance.%s" % (cid, key))
        skills = ch.get("skills") or []
        if len(skills) < 3:
            errors.append("%s needs 3 skills" % cid)
        for sid in skills:
            skill_ids.add(sid)
        weapon_ids.add(ch.get("weapon"))
        for other in ch.get("relationships") or []:
            if other == cid:
                errors.append("%s self relationship" % cid)

    playable = [c for c in characters if c.get("id") != "oblivion"]
    if len(playable) != 100:
        errors.append("expected 100 playable characters, got %d" % len(playable))
    for founder in FOUNDERS:
        if founder not in seen:
            errors.append("missing founder %s" % founder)

    skill_file = DATA / "skills" / "skills.json"
    if skill_file.exists():
        catalog_skills = {row["id"] for row in load_json(skill_file)}
        missing = skill_ids - catalog_skills
        if missing:
            errors.append("skill refs missing: %s" % sorted(missing)[:8])
    weapon_file = DATA / "weapons" / "weapons.json"
    if weapon_file.exists():
        catalog_weapons = {row["id"] for row in load_json(weapon_file)}
        missing = {w for w in weapon_ids if w} - catalog_weapons
        if missing:
            errors.append("weapon refs missing: %s" % sorted(missing)[:8])

    rel_file = DATA / "relationships" / "relationships.json"
    if rel_file.exists():
        for row in load_json(rel_file):
            if row.get("to") not in seen and row.get("to") != "osiris":
                errors.append("relationship target missing: %s -> %s" % (row.get("from"), row.get("to")))

    if errors:
        print("VALIDATE FAIL (%d)" % len(errors))
        for err in errors[:40]:
            print(" -", err)
        return 1
    print(
        "VALIDATE OK characters=%d playable=%d civilizations=%d founders=%d"
        % (len(characters), len(playable), len(civ_ids), len(FOUNDERS))
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
