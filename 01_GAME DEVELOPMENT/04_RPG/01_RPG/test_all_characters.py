#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Spawn-level data test for all 100 characters."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CATALOG = ROOT / "data" / "relicsia.json"
REQUIRED = ("id", "name_ja", "civilization", "era", "stats", "skills", "portrait")


def main() -> int:
    doc = json.loads(CATALOG.read_text(encoding="utf-8"))
    errors = []
    for ch in doc.get("characters", []):
        cid = ch.get("id", "?")
        for key in REQUIRED:
            if key not in ch:
                errors.append("%s missing %s" % (cid, key))
        stats = ch.get("stats") or {}
        if any(stats.get(k, 0) <= 0 for k in ("hp", "attack", "defense", "speed")):
            errors.append("%s bad stats" % cid)
        if cid != "oblivion" and not ch.get("playable", True):
            errors.append("%s should be playable data" % cid)
    founders = set(doc.get("founders", []))
    if founders != {"amaterasu", "athena", "isis", "roma", "xishi", "edo"}:
        errors.append("founders mismatch: %s" % sorted(founders))
    if errors:
        print("CHARACTER TEST FAIL (%d)" % len(errors))
        for err in errors[:20]:
            print(" -", err)
        return 1
    print("CHARACTER TEST OK count=%d founders=%s" % (len(doc.get("characters", [])), sorted(founders)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
