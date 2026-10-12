# -*- coding: utf-8 -*-
"""Character 3D card / proxy mesh from portrait PNG."""

from __future__ import annotations

import json
from pathlib import Path

from _mesh import write_obj

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "assets" / "raw"


def run(name: str = "amaterasu", portrait: str = ""):
    RAW.mkdir(parents=True, exist_ok=True)
    verts = [(-0.45, 0, 0), (0.45, 0, 0), (0.45, 1.8, 0), (-0.45, 1.8, 0)]
    faces = [(1, 2, 3, 4)]
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    obj = RAW / ("%s.obj" % name)
    write_obj(obj, verts, faces, uvs)
    meta = {
        "id": name,
        "obj": str(obj.relative_to(ROOT)).replace("\\", "/"),
        "portrait": portrait or ("assets/characters/%s.png" % name),
        "rig": "auto_rig",
        "lod": ["lod0", "lod1", "lod2"],
    }
    (RAW / ("%s.json" % name)).write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    try:
        import bpy
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.wm.obj_import(filepath=str(obj))
        bpy.ops.export_scene.fbx(filepath=str(RAW / ("%s.fbx" % name)))
        print("blender fbx", name)
    except ImportError:
        print("wrote obj", obj)


if __name__ == "__main__":
    import sys
    run(sys.argv[1] if len(sys.argv) > 1 else "amaterasu")
