# -*- coding: utf-8 -*-
"""透過立ち絵 → 顔・目・口・髪・腕・胴のパーツPNG。"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CUTOUT = ROOT / "assets" / "characters" / "cutout"
PARTS = ROOT / "assets" / "characters" / "parts"

REGIONS = {
    "hair": (0.08, 0.00, 0.92, 0.38),
    "face": (0.28, 0.10, 0.72, 0.42),
    "eyes": (0.30, 0.16, 0.70, 0.28),
    "mouth": (0.40, 0.28, 0.60, 0.38),
    "body": (0.18, 0.36, 0.82, 0.98),
    "arm_l": (0.00, 0.38, 0.32, 0.88),
    "arm_r": (0.68, 0.38, 1.00, 0.88),
}


def _bbox(img: Image.Image):
    alpha = img.getchannel("A")
    box = alpha.getbbox()
    return box or (0, 0, img.width, img.height)


def split_one(src: Path, dest_dir: Path):
    img = Image.open(src).convert("RGBA")
    x0, y0, x1, y1 = _bbox(img)
    w, h = x1 - x0, y1 - y0
    dest_dir.mkdir(parents=True, exist_ok=True)
    img.save(dest_dir / "full.png")
    meta = {"id": src.stem, "parts": []}
    for name, (u0, v0, u1, v1) in REGIONS.items():
        box = (
            int(x0 + w * u0),
            int(y0 + h * v0),
            int(x0 + w * u1),
            int(y0 + h * v1),
        )
        part = img.crop(box)
        part.save(dest_dir / ("%s.png" % name))
        meta["parts"].append({
            "name": name,
            "file": "%s.png" % name,
            "pivot": [0.5, 0.5],
            "box": list(box),
        })
    (dest_dir / "parts.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def run(ids=None):
    count = 0
    for src in sorted(CUTOUT.glob("*.png")):
        if ids and src.stem not in ids:
            continue
        split_one(src, PARTS / src.stem)
        count += 1
    print("parts", count, PARTS)
    return count


if __name__ == "__main__":
    run()
