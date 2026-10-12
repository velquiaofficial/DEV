# -*- coding: utf-8 -*-
from pathlib import Path


def run(dest: str = "assets/raw/amaterasu.fbx"):
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    try:
        import bpy
    except ImportError:
        print("blender skip export_fbx", dest)
        return
    bpy.ops.export_scene.fbx(filepath=dest, use_selection=False)


if __name__ == "__main__":
    run()
