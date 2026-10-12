# -*- coding: utf-8 -*-
from pathlib import Path


def write_obj(path: Path, verts, faces, uvs=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# AETERNA blender pipeline", "o %s" % path.stem]
    for v in verts:
        lines.append("v %.5f %.5f %.5f" % v)
    if uvs:
        for uv in uvs:
            lines.append("vt %.5f %.5f" % uv)
    for face in faces:
        if uvs:
            lines.append("f " + " ".join("%d/%d" % (i, i) for i in face))
        else:
            lines.append("f " + " ".join(str(i) for i in face))
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def box(cx, cy, cz, sx, sy, sz):
    hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
    verts = [
        (cx - hx, cy - hy, cz - hz),
        (cx + hx, cy - hy, cz - hz),
        (cx + hx, cy + hy, cz - hz),
        (cx - hx, cy + hy, cz - hz),
        (cx - hx, cy - hy, cz + hz),
        (cx + hx, cy - hy, cz + hz),
        (cx + hx, cy + hy, cz + hz),
        (cx - hx, cy + hy, cz + hz),
    ]
    faces = [
        (1, 2, 3, 4),
        (5, 8, 7, 6),
        (1, 5, 6, 2),
        (4, 3, 7, 8),
        (1, 4, 8, 5),
        (2, 6, 7, 3),
    ]
    return verts, faces
