# -*- coding: utf-8 -*-
"""パーツ → まばたき・呼吸の2Dクリップ。"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTS = ROOT / "assets" / "characters" / "parts"


def clip_for(cid: str):
    return {
        "id": cid,
        "fps": 30,
        "loop": True,
        "tracks": [
            {"part": "full", "prop": "y", "keys": [[0, 0], [1.2, 6], [2.4, 0]]},
            {"part": "hair", "prop": "rot", "keys": [[0, -1.2], [1.4, 1.2], [2.8, -1.2]]},
            {"part": "eyes", "prop": "scale_y", "keys": [[0, 1], [2.1, 1], [2.16, 0.08], [2.24, 1], [4.0, 1]]},
            {"part": "arm_l", "prop": "rot", "keys": [[0, 0], [1.6, 3], [3.2, 0]]},
            {"part": "arm_r", "prop": "rot", "keys": [[0, 0], [1.6, -3], [3.2, 0]]},
        ],
    }


def run(ids=None):
    n = 0
    folders = [p for p in PARTS.iterdir() if p.is_dir()] if PARTS.exists() else []
    for folder in folders:
        if ids and folder.name not in ids:
            continue
        doc = clip_for(folder.name)
        (folder / "anim_idle.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        n += 1
    print("anim", n)
    return n


if __name__ == "__main__":
    run()
