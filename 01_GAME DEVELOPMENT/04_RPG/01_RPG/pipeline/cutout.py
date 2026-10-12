# -*- coding: utf-8 -*-
"""AI立ち絵 → 背景透過PNG。"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIRS = [
    ROOT / "assets" / "characters",
    ROOT / "assets" / "characters" / "yamato",
    ROOT / "assets" / "characters" / "hellas",
    ROOT / "assets" / "characters" / "kemet",
    ROOT / "assets" / "characters" / "mesopotamia",
    ROOT / "assets" / "characters" / "celtic",
    ROOT / "assets" / "characters" / "tokyo",
    ROOT / "assets" / "characters" / "huaxia",
    ROOT / "assets" / "characters" / "rome",
    ROOT / "assets" / "characters" / "norse",
    ROOT / "assets" / "characters" / "void",
]
OUT = ROOT / "assets" / "characters" / "cutout"
SKIP = {"roster_100", "roster_sheet", "battlefield_tokyo", "tokyo_ruins", "yata_mirror"}


def _flood_alpha(img: Image.Image, thresh: int = 28) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    pix = rgba.load()
    corners = [pix[0, 0], pix[w - 1, 0], pix[0, h - 1], pix[w - 1, h - 1]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    seen = [[False] * h for _ in range(w)]
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for x in range(0, w, max(1, w // 16)):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(0, h, max(1, h // 16)):
        stack.append((0, y))
        stack.append((w - 1, y))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            continue
        r, g, b, a = pix[x, y]
        if a < 8:
            seen[x][y] = True
            continue
        if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > thresh * 3:
            continue
        seen[x][y] = True
        pix[x, y] = (r, g, b, 0)
        stack.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    return rgba


def cut_one(src: Path, dest: Path) -> bool:
    img = Image.open(src)
    rgba = img.convert("RGBA")
    alpha = rgba.getchannel("A")
    if alpha.getextrema()[0] < 250:
        out = rgba
    else:
        try:
            from io import BytesIO
            from rembg import remove
            raw = remove(rgba)
            if isinstance(raw, Image.Image):
                out = raw.convert("RGBA")
            else:
                out = Image.open(BytesIO(raw)).convert("RGBA")
        except Exception:
            out = _flood_alpha(rgba)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "PNG")
    return True


def find_sources():
    found = {}
    for folder in SRC_DIRS:
        if not folder.exists():
            continue
        for path in folder.glob("*.png"):
            if path.stem in SKIP or path.parent.name in {"sheet", "cutout", "parts", "portraits"}:
                continue
            if path.stat().st_size < 8000:
                continue
            found[path.stem] = path
    return found


def run(ids=None):
    sources = find_sources()
    OUT.mkdir(parents=True, exist_ok=True)
    done = []
    for cid, src in sources.items():
        if ids and cid not in ids:
            continue
        dest = OUT / ("%s.png" % cid)
        cut_one(src, dest)
        done.append(cid)
    print("cutout", len(done), OUT)
    return done


if __name__ == "__main__":
    run()
