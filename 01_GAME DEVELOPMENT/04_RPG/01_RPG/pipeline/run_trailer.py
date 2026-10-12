# -*- coding: utf-8 -*-
"""
Cursor → Blender+Python → UE5 (Sequencer / Niagara / Lumen / PCG / HLSL)
→ Movie Render Queue → PNG/EXR → FFmpeg → 30s MP4
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = Path(__file__).resolve().parent / "manifest.json"


def py(*rel):
    return [sys.executable, str(ROOT.joinpath(*rel))]


def run():
    steps = [
        ("cursor", py("tools", "generate_trailer.py")),
        ("blender", py("blender", "run_pipeline.py")),
        ("unreal_import", py("tools", "unreal", "import_assets.py")),
        ("sequencer", py("tools", "unreal", "create_sequence.py")),
        ("movie_render", py("tools", "unreal", "movie_render.py")),
        ("ffmpeg", py("tools", "encode_trailer.py")),
    ]
    log = []
    for name, cmd in steps:
        print("==", name, "==")
        result = subprocess.run(cmd, cwd=str(ROOT))
        log.append({"step": name, "code": result.returncode})
    mp4 = ROOT / "Output" / "YouTube" / "Aeterna_Trailer_001.mp4"
    MANIFEST.write_text(json.dumps({
        "pipeline": [
            "Cursor",
            "Blender+Python",
            "UE5 Sequencer/Niagara/Lumen/PCG/HLSL",
            "Movie Render Queue",
            "PNG/EXR",
            "FFmpeg",
            "30s MP4",
        ],
        "mp4": str(mp4).replace("\\", "/"),
        "ready": mp4.exists(),
        "log": log,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("manifest", MANIFEST, "mp4", mp4.exists())


if __name__ == "__main__":
    run()
