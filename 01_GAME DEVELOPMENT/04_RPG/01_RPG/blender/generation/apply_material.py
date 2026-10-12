# -*- coding: utf-8 -*-


def run(albedo: str = ""):
    try:
        import bpy
    except ImportError:
        print("blender skip apply_material", albedo)
        return
    mat = bpy.data.materials.new("AeternaSkin")
    mat.use_nodes = True
    if albedo:
        img = bpy.data.images.load(albedo)
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = img


if __name__ == "__main__":
    run()
