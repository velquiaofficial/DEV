# -*- coding: utf-8 -*-
from pathlib import Path

from export_fbx import run as export_one


def run(ids=("amaterasu", "athena", "anubis")):
    root = Path(__file__).resolve().parents[2] / "assets" / "raw"
    for cid in ids:
        export_one(str(root / ("%s.fbx" % cid)))


if __name__ == "__main__":
    run()
