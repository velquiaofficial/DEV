# -*- coding: utf-8 -*-
"""Torii, Yata mirror, Greek column proxies."""

from __future__ import annotations

from pathlib import Path

from _mesh import box, write_obj

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "assets" / "raw" / "props"


def _merge(parts):
    verts = []
    faces = []
    offset = 0
    for vs, fs in parts:
        verts.extend(vs)
        faces.extend([tuple(i + offset for i in face) for face in fs])
        offset += len(vs)
    return verts, faces


def run():
    RAW.mkdir(parents=True, exist_ok=True)
    torii = _merge([
        box(-1.2, 1.2, 0, 0.18, 2.4, 0.18),
        box(1.2, 1.2, 0, 0.18, 2.4, 0.18),
        box(0, 2.45, 0, 2.8, 0.16, 0.22),
        box(0, 2.65, 0, 3.1, 0.1, 0.26),
    ])
    write_obj(RAW / "torii.obj", *torii)
    write_obj(RAW / "yata_mirror.obj", *box(0, 1.0, 0, 0.9, 0.9, 0.06))
    write_obj(RAW / "column.obj", *box(0, 1.4, 0, 0.28, 2.8, 0.28))
    print("props", RAW)


if __name__ == "__main__":
    run()
