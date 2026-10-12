# -*- coding: utf-8 -*-
"""Import a character mesh and normalize scale."""

from __future__ import annotations

from pathlib import Path


def run(src: str, name: str = "amaterasu"):
    try:
        import bpy
    except ImportError:
        print("blender skip import_character", src, name)
        return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    path = Path(src)
    if path.suffix.lower() in {".fbx"}:
        bpy.ops.import_scene.fbx(filepath=str(path))
    elif path.suffix.lower() in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    else:
        bpy.ops.wm.obj_import(filepath=str(path))
    for obj in bpy.context.selected_objects:
        obj.name = name
        obj.scale = (1.0, 1.0, 1.0)


if __name__ == "__main__":
    import sys
    run(sys.argv[-1] if len(sys.argv) > 1 else "assets/raw/amaterasu.fbx")
