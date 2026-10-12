# -*- coding: utf-8 -*-
"""Name bones to a shared female skeleton convention."""

from __future__ import annotations

BONES = ("root", "hips", "spine", "chest", "neck", "head", "hand_l", "hand_r")


def run():
    try:
        import bpy
    except ImportError:
        print("blender skip auto_rig", BONES)
        return
    armature = next((o for o in bpy.data.objects if o.type == "ARMATURE"), None)
    if armature is None:
        bpy.ops.object.armature_add()
        armature = bpy.context.active_object
    armature.name = "AeternaFemale"


if __name__ == "__main__":
    run()
