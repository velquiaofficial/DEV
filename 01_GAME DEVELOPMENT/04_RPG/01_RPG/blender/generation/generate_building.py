# -*- coding: utf-8 -*-
"""Tokyo ruins building proxies for PCG / Unreal import."""

from __future__ import annotations

from pathlib import Path

from _mesh import box, write_obj

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "assets" / "raw" / "buildings"


def run(count: int = 8):
    RAW.mkdir(parents=True, exist_ok=True)
    sizes = [(6, 18, 6), (4, 12, 5), (8, 24, 7), (5, 9, 5), (7, 20, 6), (4, 28, 4), (9, 14, 8), (5, 16, 5)]
    for i in range(count):
        sx, sy, sz = sizes[i % len(sizes)]
        verts, faces = box(0, sy * 0.5, 0, sx, sy, sz)
        write_obj(RAW / ("tokyo_block_%02d.obj" % i), verts, faces)
    print("buildings", count, RAW)


if __name__ == "__main__":
    run()
