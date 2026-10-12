# -*- coding: utf-8 -*-
"""
AI立ち絵 → 透過PNG → パーツ分割 → 2Dアニメ → Unity
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from animate_2d import run as animate
from cutout import run as cutout
from split_parts import run as split

ROOT = Path(__file__).resolve().parents[1]
UNITY = ROOT / "game" / "unity" / "Aeterna" / "Assets" / "StreamingAssets"


def run():
    ids = cutout()
    split()
    animate()
    dest = UNITY / "characters"
    src_parts = ROOT / "assets" / "characters" / "parts"
    if src_parts.exists():
        dest.mkdir(parents=True, exist_ok=True)
        for folder in src_parts.iterdir():
            if not folder.is_dir():
                continue
            target = dest / folder.name
            if target.exists():
                shutil.rmtree(target, ignore_errors=True)
            shutil.copytree(folder, target)
    (ROOT / "pipeline" / "manifest_2d.json").write_text(json.dumps({
        "pipeline": [
            "AI character art",
            "transparent PNG",
            "part split",
            "2D animation",
            "Unity combat/UI/FX/story/gacha/growth",
            "PC / Android",
        ],
        "characters": ids,
        "count": len(ids),
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("2d pipeline", len(ids))


if __name__ == "__main__":
    run()
