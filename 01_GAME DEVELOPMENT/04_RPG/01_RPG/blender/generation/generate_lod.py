# -*- coding: utf-8 -*-


def run(levels=(0.75, 0.45, 0.2)):
    try:
        import bpy
    except ImportError:
        print("blender skip generate_lod", levels)
        return
    for obj in bpy.context.selected_objects:
        if obj.type != "MESH":
            continue
        for ratio in levels:
            lod = obj.copy()
            lod.data = obj.data.copy()
            bpy.context.collection.objects.link(lod)
            lod.name = "%s_LOD_%s" % (obj.name, int(ratio * 100))


if __name__ == "__main__":
    run()
