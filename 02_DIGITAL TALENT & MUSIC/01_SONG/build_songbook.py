# -*- coding: utf-8 -*-
"""オリジナル10曲の歌詞・楽譜・MIDI・試聴ページを書き出す。"""

from __future__ import annotations

import html
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TPQ = 480

PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
LETTER_STEP = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}
ACC_OF = {"": "", "#": "#", "b": "b"}

# 調号。トレブルの五線位置は E4 = 0。
KEY_SIG = {
    "C": [],
    "G": ["F#"],
    "D": ["F#", "C#"],
    "A": ["F#", "C#", "G#"],
    "E": ["F#", "C#", "G#", "D#"],
    "F": ["Bb"],
    "Bb": ["Bb", "Eb"],
    "Eb": ["Bb", "Eb", "Ab"],
    "Am": [],
    "Em": ["F#"],
    "Bm": ["F#", "C#"],
    "Dm": ["Bb"],
}
SIG_POS = {
    "F#": 8, "C#": 5, "G#": 9, "D#": 6, "A#": 3, "E#": 7, "B#": 4,
    "Bb": 4, "Eb": 7, "Ab": 3, "Db": 6, "Gb": 2, "Cb": 5, "Fb": 1,
}


def parse_pitch(token: str):
    m = re.fullmatch(r"([A-G])([#b]?)(-?\d)", token)
    if not m:
        raise ValueError(f"音名が読めません: {token}")
    return m.group(1), m.group(2), int(m.group(3))


def pitch_midi(token: str) -> int:
    letter, acc, octave = parse_pitch(token)
    pc = PC[letter] + (1 if acc == "#" else -1 if acc == "b" else 0)
    return (octave + 1) * 12 + pc


def midi_name(midi: int, flats: bool) -> str:
    octave = midi // 12 - 1
    pc = midi % 12
    return f"{(FLAT_NAMES if flats else SHARP_NAMES)[pc]}{octave}"


def chord_midis(symbol: str, octave: int = 4):
    m = re.fullmatch(r"([A-G](?:#|b)?)(m7|m|7)?", symbol)
    if not m:
        raise ValueError(f"コードが読めません: {symbol}")
    root = pitch_midi(m.group(1) + str(octave))
    qual = m.group(2) or ""
    steps = {"": (0, 4, 7), "m": (0, 3, 7), "7": (0, 4, 7, 10), "m7": (0, 3, 7, 10)}[qual]
    return [root + s for s in steps]


def chord_pcs(symbol: str) -> set[int]:
    return {n % 12 for n in chord_midis(symbol, 4)}


def bar(chord: str, spec: str, lyric: str | None = None, show: str | None = None):
    events = []
    for tok in spec.split():
        if tok.startswith("r"):
            dur = int(tok.split(":")[1]) if ":" in tok else 1
            events.append({"rest": True, "dur": dur, "pitch": None, "lyric": None})
        else:
            name, _, dur_s = (tok.partition(":") if ":" in tok else (tok, "", ""))
            # partition logic above is wrong when no colon. Handle both.
            if ":" in tok:
                name, dur_s = tok.split(":")
                dur = int(dur_s)
            else:
                name, dur = tok, 1
            events.append({"rest": False, "dur": dur, "pitch": name, "lyric": None})
    words = lyric.split() if lyric else []
    notes = [e for e in events if not e["rest"]]
    # 歌詞が1モーラだけ多いときは、最後の長い音を同じ高さで二分する。
    if lyric is not None and len(words) == len(notes) + 1:
        for idx in range(len(events) - 1, -1, -1):
            e = events[idx]
            if (not e["rest"]) and e["dur"] >= 2 and e["dur"] % 2 == 0:
                e["dur"] //= 2
                events.insert(idx + 1, {"rest": False, "dur": e["dur"], "pitch": e["pitch"], "lyric": None})
                break
        notes = [e for e in events if not e["rest"]]
    if lyric is not None and len(words) != len(notes):
        raise ValueError(
            f"{chord} / {spec} / 歌詞{len(words)}語と音符{len(notes)}が合いません: {lyric}"
        )
    for e, w in zip(notes, words):
        e["lyric"] = w
    total = sum(e["dur"] for e in events)
    if total != 8:
        raise ValueError(f"小節が8分音符8つになりません ({total}): {spec}")
    return {"chord": chord, "events": events, "show": show}


ERRORS: list[str] = []


def section(sid: str, label: str, rows: list):
    bars = []
    for i, row in enumerate(rows, 1):
        try:
            bars.append(bar(*row))
        except ValueError as e:
            ERRORS.append(f"{sid} {label} {i}小節: {e}")
            bars.append(bar(row[0], "r:8"))
    return {"id": sid, "label": label, "bars": bars, "from": None}


def derived(sid: str, label: str, source: str, take: int | None = None, resolve=None):
    return {
        "id": sid,
        "label": label,
        "bars": None,
        "from": source,
        "take": take,
        "resolve": resolve,
        "instrumental": True,
    }


def arpeggio(sid: str, label: str, chords: list[str], flats: bool):
    rows = []
    for ch in chords:
        midis = chord_midis(ch, 4)
        names = [midi_name(m, flats) for m in midis[:3]]
        high = midi_name(midis[0] + 12, flats)
        spec = f"{names[0]}:2 {names[1]}:2 {names[2]}:2 {high}:2"
        rows.append((ch, spec))
    return section(sid, label, rows)


def resolve_sections(song: dict):
    by_id = {s["id"]: s for s in song["sections"]}
    for s in song["sections"]:
        if not s.get("from"):
            continue
        src = by_id[s["from"]]
        if src.get("from"):
            raise ValueError("派生の入れ子は使えません")
        taken = [dict(b, events=[dict(e) for e in b["events"]]) for b in src["bars"]]
        if s.get("take"):
            taken = taken[: s["take"]]
        if s.get("resolve"):
            chord, pitch = s["resolve"]
            taken[-1] = bar(chord, f"{pitch}:8")
        if s.get("instrumental"):
            for b in taken:
                b["show"] = None
                for e in b["events"]:
                    e["lyric"] = None
        s["bars"] = taken
    return by_id


def expand(song: dict, by_id: dict):
    out = []
    for item in song["form"]:
        sid = item if isinstance(item, str) else item[0]
        sec = by_id[sid]
        out.append(sec)
    return out


def duration_sec(song: dict, expanded: list) -> float:
    bars = sum(len(s["bars"]) for s in expanded)
    return bars * 4 * 60 / song["bpm"]


def fmt_time(sec: float) -> str:
    sec = int(round(sec))
    return f"{sec // 60}:{sec % 60:02d}"


def strong_beat_warnings(song: dict, by_id: dict):
    warns = []
    for s in song["sections"]:
        if s.get("from"):
            continue
        for i, b in enumerate(s["bars"], 1):
            pcs = chord_pcs(b["chord"])
            pos = 0
            for e in b["events"]:
                if not e["rest"]:
                    for beat in (0, 4):
                        if e["pitch"] and pos <= beat < pos + e["dur"]:
                            if pitch_midi(e["pitch"]) % 12 not in pcs:
                                warns.append(
                                    f"{song['title']} {s['label']} {i}小節 {b['chord']} の強拍がコード外: {e['pitch']}"
                                )
                                break
                pos += e["dur"]
    return warns


def staff_pos(pitch: str) -> int:
    letter, _, octave = parse_pitch(pitch)
    return LETTER_STEP[letter] + octave * 7 - (LETTER_STEP["E"] + 4 * 7)


def accidental(pitch: str, key: str) -> str:
    letter, acc, _ = parse_pitch(pitch)
    sig = {n[0]: n[1:] for n in KEY_SIG[key]}
    current = sig.get(letter, "")
    if acc == current:
        return ""
    return "n" if acc == "" else acc


def abc_pitch(pitch: str, key: str) -> str:
    letter, acc, octave = parse_pitch(pitch)
    mark = {"#": "^", "b": "_", "": ""}[acc]
    # 調号にある臨時記号はABC側のK:に任せる。ナチュラルだけ残す。
    sig = {n[0]: n[1:] for n in KEY_SIG[key]}
    if acc == sig.get(letter, ""):
        mark = ""
    elif acc == "" and letter in sig:
        mark = "="
    name = letter
    # ABC: C = 中央ハ、c = 1オクターブ上。
    if octave >= 5:
        name = letter.lower() + "'" * (octave - 5)
    elif octave == 4:
        name = letter.upper()
    else:
        name = letter.upper() + "," * (4 - octave)
    return mark + name


def render_abc(song: dict):
    lines = [
        "X:1",
        f"T:{song['title']}",
        "C:オリジナル",
        "M:4/4",
        "L:1/8",
        f"Q:1/4={song['bpm']}",
        f"K:{song['abc_key']}",
    ]
    for s in song["sections"]:
        if s.get("from") and not s.get("resolve"):
            continue
        lines.append(f"P:{s['label']}")
        lyric_row = []
        bar_chunks = []
        for b in s["bars"]:
            chunk = [f'"{b["chord"]}"']
            words = []
            for e in b["events"]:
                if e["rest"]:
                    chunk.append(f"z{e['dur']}" if e["dur"] != 1 else "z")
                    words.append("*")
                else:
                    token = abc_pitch(e["pitch"], song["key"])
                    chunk.append(token if e["dur"] == 1 else f"{token}{e['dur']}")
                    words.append(e["lyric"] if e["lyric"] else "*")
            bar_chunks.append(" ".join(chunk))
            lyric_row.append(" ".join(words))
        # 4小節ごとに改行
        for i in range(0, len(bar_chunks), 4):
            lines.append(" | ".join(bar_chunks[i : i + 4]) + " |")
            lines.append("w: " + " | ".join(lyric_row[i : i + 4]))
    lines.append("")
    return "\n".join(lines)


def vlq(n: int) -> bytes:
    buf = [n & 0x7F]
    n >>= 7
    while n:
        buf.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(buf))


def meta_text(kind: int, text: str) -> bytes:
    raw = text.encode("utf-8")
    return bytes([0xFF, kind, len(raw)]) + raw


def write_midi(path: Path, song: dict, expanded: list):
    uspq = int(60_000_000 / song["bpm"])
    eighth = TPQ // 2
    melody = []
    chords = []
    t = 0
    for s in expanded:
        for b in s["bars"]:
            cnotes = chord_midis(b["chord"], 3)
            for n in cnotes:
                chords.append((t, eighth * 8 - 1, n, 46))
            pos = 0
            for e in b["events"]:
                if not e["rest"]:
                    dur = e["dur"] * eighth
                    off = max(1, dur - 10)
                    melody.append((t + pos * eighth, off, pitch_midi(e["pitch"]), 92, e["lyric"]))
                pos += e["dur"]
            t += 8 * eighth

    def track_from(events, program: int, name: str, with_lyric=False, tempo=False):
        evs = []
        if tempo:
            evs.append((0, bytes([0xFF, 0x51, 0x03]) + struct.pack(">I", uspq)[1:]))
        evs.append((0, meta_text(0x03, name)))
        evs.append((0, bytes([0xC0 if program < 128 else 0xC0, program])))
        timed = []
        for item in events:
            if with_lyric:
                start, dur, note, vel, lyric = item
                timed.append((start, bytes([0x90, note, vel])))
                if lyric:
                    timed.append((start, meta_text(0x05, lyric)))
                timed.append((start + dur, bytes([0x80, note, 0])))
            else:
                start, dur, note, vel = item
                timed.append((start, bytes([0x91, note, vel])))
                timed.append((start + dur, bytes([0x81, note, 0])))
        timed.sort(key=lambda x: (x[0], 0 if x[1][0] in (0x80, 0x81) else 1))
        last = 0
        data = b""
        # prefix events at 0
        body = []
        for tick, raw in evs:
            body.append((tick, raw))
        body.extend(timed)
        body.append((t, bytes([0xFF, 0x2F, 0x00])))
        body.sort(key=lambda x: x[0])
        for tick, raw in body:
            data += vlq(tick - last) + raw
            last = tick
        return b"MTrk" + struct.pack(">I", len(data)) + data

    # program change belongs inside the track with running status carefully.
    # Rebuild simply.
    def build_track(channel: int, program: int, name: str, notes, lyric=False, tempo=False):
        events = []
        if tempo:
            events.append((0, 0, bytes([0xFF, 0x51, 0x03]) + struct.pack(">I", uspq)[1:]))
        events.append((0, 1, meta_text(0x03, name)))
        events.append((0, 2, bytes([0xC0 | channel, program])))
        for item in notes:
            if lyric:
                start, dur, note, vel, word = item
                events.append((start, 3, bytes([0x90 | channel, note, vel])))
                if word:
                    events.append((start, 4, meta_text(0x05, word)))
                events.append((start + dur, 0, bytes([0x80 | channel, note, 0])))
            else:
                start, dur, note, vel = item
                events.append((start, 3, bytes([0x90 | channel, note, vel])))
                events.append((start + dur, 0, bytes([0x80 | channel, note, 0])))
        events.append((t, 5, bytes([0xFF, 0x2F, 0x00])))
        events.sort(key=lambda x: (x[0], x[1]))
        data = b""
        last = 0
        for tick, _, raw in events:
            data += vlq(max(0, tick - last)) + raw
            last = tick
        return b"MTrk" + struct.pack(">I", len(data)) + data

    header = b"MThd" + struct.pack(">IHHH", 6, 1, 2, TPQ)
    trk = build_track(1, 48, "chords", chords, False, True)
    trk += build_track(0, 0, "melody", melody, True, False)
    path.write_bytes(header + trk)


def poem_lines(sec: dict) -> list[str]:
    shows = []
    buf = []
    for b in sec["bars"]:
        text = b["show"] if b["show"] else "".join(e["lyric"] or "" for e in b["events"])
        if not text:
            continue
        buf.append(text)
        if len(buf) == 2:
            shows.append("　".join(buf))
            buf = []
    if buf:
        shows.append("　".join(buf))
    return shows


def performed_lyrics(expanded: list) -> str:
    chunks = []
    i = 0
    while i < len(expanded):
        lines = poem_lines(expanded[i])
        j = i + 1
        while j < len(expanded) and expanded[j]["label"] == expanded[i]["label"] and poem_lines(expanded[j]) == lines:
            j += 1
        n = j - i
        mark = f" ×{n}" if n > 1 else ""
        if not lines:
            chunks.append(f"（{expanded[i]['label']}{mark}）")
        else:
            chunks.append(f"[{expanded[i]['label']}{mark}]")
            chunks.extend(lines)
        i = j
    return "\n".join(chunks)


# ----- SVG -----

def svg_section(song: dict, sec: dict) -> str:
    space = 10
    page_w = 900
    sys_h = 168
    bars = sec["bars"]
    per = 2
    systems = (len(bars) + per - 1) // per
    height = systems * sys_h + 8
    parts = [
        f'<svg class="staff" viewBox="0 0 {page_w} {height}" width="100%" role="img" aria-label="{html.escape(song["title"])} {html.escape(sec["label"])}">'
    ]
    key = song["key"]
    sig = KEY_SIG[key]

    def y_of(pos, top):
        bottom = top + 4 * space
        return bottom - pos * (space / 2)

    for si in range(systems):
        top = 54 + si * sys_h
        group = bars[si * per : si * per + per]
        prefix = 42 + len(sig) * 13 + (26 if si == 0 else 0)
        usable = page_w - 24 - prefix
        bar_w = usable / per
        eighth = bar_w / 8
        # 五線
        for i in range(5):
            y = top + i * space
            parts.append(f'<line x1="12" y1="{y}" x2="{page_w - 12}" y2="{y}" class="line"/>')
        # 音部記号
        parts.append(
            f'<text x="16" y="{top + 34}" class="clef">𝄞</text>'
        )
        for i, name in enumerate(sig):
            x = 48 + i * 13
            yy = y_of(SIG_POS[name], top)
            glyph = "♯" if name.endswith("#") else "♭"
            parts.append(f'<text x="{x}" y="{yy + 4}" class="acc">{glyph}</text>')
        if si == 0:
            tx = 48 + len(sig) * 13
            parts.append(f'<text x="{tx}" y="{top + 18}" class="time">4</text>')
            parts.append(f'<text x="{tx}" y="{top + 36}" class="time">4</text>')
        x0 = 16 + prefix
        for bi, b in enumerate(group):
            bx = x0 + bi * bar_w
            measure_no = si * per + bi + 1
            parts.append(f'<text x="{bx + 2}" y="{top - 28}" class="mno">{measure_no}</text>')
            parts.append(f'<text x="{bx + 2}" y="{top - 12}" class="chord">{html.escape(b["chord"])}</text>')
            # 小節線
            parts.append(f'<line x1="{bx}" y1="{top}" x2="{bx}" y2="{top + 4 * space}" class="barline"/>')
            # 音符
            cursor = 0
            drawn = []
            for e in b["events"]:
                drawn.append((cursor, e))
                cursor += e["dur"]
            # 連桁
            beams = []
            cur = []
            for start, e in drawn:
                if (not e["rest"]) and e["dur"] == 1:
                    pair = start // 4
                    if cur and (cur[-1][0] // 4 != pair or start != cur[-1][0] + cur[-1][1]["dur"]):
                        if len(cur) >= 2:
                            beams.append(cur)
                        cur = [(start, e)]
                    else:
                        cur.append((start, e))
                else:
                    if len(cur) >= 2:
                        beams.append(cur)
                    cur = []
            if len(cur) >= 2:
                beams.append(cur)
            def head_xy(start, pitch):
                cx = bx + 10 + start * eighth
                cy = y_of(staff_pos(pitch), top)
                return cx, cy

            beam_down = {}
            beam_end = {}
            for grp in beams:
                positions = [staff_pos(e["pitch"]) for _, e in grp]
                down = (sum(positions) / len(positions)) >= 4
                if down:
                    yb = max(head_xy(st, ev["pitch"])[1] for st, ev in grp) + 32
                else:
                    yb = min(head_xy(st, ev["pitch"])[1] for st, ev in grp) - 32
                for _, ev in grp:
                    beam_down[id(ev)] = down
                    beam_end[id(ev)] = yb

            for start, e in drawn:
                cx = bx + 10 + start * eighth
                if e["rest"]:
                    cy = top + 2 * space
                    parts.append(f'<text x="{cx - 4}" y="{cy + 4}" class="rest">{"𝄽" if e["dur"] >= 2 else "𝄾"}</text>')
                    continue
                cx, cy = head_xy(start, e["pitch"])
                pos = staff_pos(e["pitch"])
                # 加線
                if pos <= 0 or pos >= 8:
                    step = -2 if pos <= 0 else 2
                    p = 0 if pos <= 0 else 8
                    target = pos if pos % 2 == 0 else pos - 1
                    while (p >= pos if pos <= 0 else p <= pos):
                        if p % 2 == 0 and not (0 <= p <= 8):
                            ly = y_of(p, top)
                            parts.append(f'<line x1="{cx - 8}" y1="{ly}" x2="{cx + 8}" y2="{ly}" class="line"/>')
                        if p == target:
                            break
                        p += step if pos > 8 else -2
                        if abs(p) > 20:
                            break
                acc = accidental(e["pitch"], key)
                if acc:
                    glyph = {"#": "♯", "b": "♭", "n": "♮"}[acc]
                    parts.append(f'<text x="{cx - 16}" y="{cy + 4}" class="acc">{glyph}</text>')
                filled = e["dur"] < 4
                stem_down = beam_down.get(id(e), pos >= 4)
                parts.append(
                    f'<ellipse cx="{cx}" cy="{cy}" rx="5.4" ry="4" class="{"head fill" if filled else "head"}"/>'
                )
                if e["dur"] in (3, 6):
                    parts.append(f'<circle cx="{cx + 8}" cy="{cy}" r="1.6" class="head fill"/>')
                if e["dur"] < 8:
                    sx = cx + (-4.6 if stem_down else 4.6)
                    sy = beam_end.get(id(e), cy + (34 if stem_down else -34))
                    parts.append(f'<line x1="{sx}" y1="{cy}" x2="{sx}" y2="{sy}" class="stem"/>')
                    if e["dur"] == 1 and id(e) not in beam_down:
                        if stem_down:
                            parts.append(f'<path d="M {sx} {sy} q 10 4 8 14" class="stem"/>')
                        else:
                            parts.append(f'<path d="M {sx} {sy} q 10 -4 8 -14" class="stem"/>')
                if e["lyric"]:
                    parts.append(
                        f'<text x="{cx}" y="{top + 62}" class="ly">{html.escape(e["lyric"])}</text>'
                    )
            for grp in beams:
                down = beam_down[id(grp[0][1])]
                x1 = head_xy(grp[0][0], grp[0][1]["pitch"])[0] + (-4.6 if down else 4.6)
                x2 = head_xy(grp[-1][0], grp[-1][1]["pitch"])[0] + (-4.6 if down else 4.6)
                yb = beam_end[id(grp[0][1])]
                parts.append(f'<line x1="{x1}" y1="{yb}" x2="{x2}" y2="{yb}" class="beam"/>')
            if b["show"]:
                parts.append(f'<text x="{bx + 8}" y="{top + 82}" class="show">{html.escape(b["show"])}</text>')
        endx = x0 + len(group) * bar_w
        parts.append(f'<line x1="{endx}" y1="{top}" x2="{endx}" y2="{top + 4 * space}" class="barline"/>')
    parts.append("</svg>")
    return "\n".join(parts)


def timeline(song: dict, expanded: list) -> str:
    total = sum(len(s["bars"]) for s in expanded)
    t = 0
    bits = ['<div class="tl">']
    colors = {
        "イントロ": "#8d8478",
        "アウトロ": "#8d8478",
        "間奏": "#8d8478",
        "Aメロ": "#2f6f8f",
        "Aメロ2": "#2f6f8f",
        "Bメロ": "#3d7a63",
        "Aメロ3": "#2f6f8f",
        "Bメロ2": "#3d7a63",
        "サビ": "#9a3b32",
        "サビ2": "#9a3b32",
        "ブリッジ": "#6d5684",
        "ブリッジ2": "#6d5684",
        "Cメロ": "#8a5a2b",
    }
    for s in expanded:
        n = len(s["bars"])
        w = 100 * n / total
        start = t * 4 * 60 / song["bpm"]
        bits.append(
            f'<div class="seg" style="width:{w:.3f}%;background:{colors.get(s["label"], "#555")}" '
            f'title="{html.escape(s["label"])} {fmt_time(start)}">'
            f'<span>{html.escape(s["label"])}</span></div>'
        )
        t += n
    bits.append("</div>")
    rows = []
    t = 0
    for s in expanded:
        n = len(s["bars"])
        start = t * 4 * 60 / song["bpm"]
        rows.append(
            f"<tr><td>{html.escape(s['label'])}</td><td>{n}</td><td>{fmt_time(start)}</td></tr>"
        )
        t += n
    table = "<table class='form'><tr><th>区間</th><th>小節</th><th>開始</th></tr>" + "".join(rows) + "</table>"
    return "".join(bits) + table


def player_notes(song: dict, expanded: list):
    eighth = 30 / song["bpm"]
    notes = []
    sections = []
    t = 0.0
    for s in expanded:
        sections.append({"label": s["label"], "t": round(t, 4), "bars": len(s["bars"])})
        for b in s["bars"]:
            for n in chord_midis(b["chord"], 3):
                notes.append({"t": round(t, 4), "d": round(eighth * 8 * 0.98, 4), "m": n, "v": 0.05, "p": 1})
            pos = 0
            for e in b["events"]:
                if not e["rest"]:
                    notes.append(
                        {
                            "t": round(t + pos * eighth, 4),
                            "d": round(e["dur"] * eighth * 0.95, 4),
                            "m": pitch_midi(e["pitch"]),
                            "v": 0.18,
                            "p": 0,
                        }
                    )
                pos += e["dur"]
            t += 8 * eighth
    return {"bpm": song["bpm"], "sec": round(t, 3), "sections": sections, "notes": notes}


PAGE_CSS = """
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0; background: #efe6d6; color: #221c16;
  font-family: "Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", serif;
}
header.book {
  padding: 36px 8vw 12px;
  border-bottom: 1px solid #d9cbb6;
}
header.book h1 { font-weight: 500; letter-spacing: 0.12em; margin: 0 0 8px; font-size: 32px; }
header.book p { max-width: 46rem; line-height: 1.75; margin: 0 0 10px; }
nav.toc {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px; padding: 18px 8vw 28px;
}
nav.toc a {
  display: block; text-decoration: none; color: inherit; background: #f7f1e6;
  border: 1px solid #ddcfba; padding: 12px 14px;
}
nav.toc a:hover { border-color: #9a3b32; }
nav.toc .no { color: #9a3b32; font-variant-numeric: tabular-nums; margin-right: 8px; }
nav.toc small { display: block; color: #5c5146; margin-top: 4px; font-family: "Yu Gothic UI", "Meiryo", sans-serif; }
article { padding: 28px 8vw 48px; border-top: 1px solid #d9cbb6; }
article h2 { font-weight: 500; letter-spacing: 0.08em; margin: 0; font-size: 28px; }
.meta { font-family: "Yu Gothic UI", "Meiryo", sans-serif; color: #4e453c; margin: 8px 0 12px; line-height: 1.6; }
.arch { line-height: 1.75; max-width: 46rem; }
.play {
  font-family: "Yu Gothic UI", "Meiryo", sans-serif;
  background: #221c16; color: #f7f1e6; border: 0; padding: 8px 16px; cursor: pointer;
  margin: 8px 8px 8px 0;
}
.play.stop { background: #9a3b32; }
.now { font-family: "Yu Gothic UI", "Meiryo", sans-serif; }
.tl { display: flex; height: 34px; width: 100%; background: #ddd; margin: 10px 0; }
.seg { height: 100%; overflow: hidden; color: #fff; font-size: 11px; font-family: "Yu Gothic UI", Meiryo, sans-serif;
  display: flex; align-items: center; justify-content: center; }
.seg span { white-space: nowrap; padding: 0 4px; }
.seg.on { outline: 2px solid #221c16; }
table.form { border-collapse: collapse; font-family: "Yu Gothic UI", Meiryo, sans-serif; font-size: 14px; margin: 8px 0 18px; }
table.form th, table.form td { border-bottom: 1px solid #ddcfba; padding: 4px 12px 4px 0; text-align: left; }
.poem { background: #f7f1e6; border-left: 3px solid #9a3b32; padding: 8px 16px; margin: 8px 0 16px; line-height: 1.9; }
.block h3 { margin: 18px 0 4px; font-weight: 500; }
.staff { background: #fbf7f0; border: 1px solid #e3d7c6; margin: 6px 0 12px; }
.line { stroke: #221c16; stroke-width: 1; }
.barline { stroke: #221c16; stroke-width: 1.2; }
.stem, .beam { stroke: #221c16; stroke-width: 1.3; fill: none; }
.head { stroke: #221c16; stroke-width: 1.2; fill: none; }
.head.fill { fill: #221c16; }
.clef { font-size: 42px; font-family: "Segoe UI Symbol", "Noto Music", serif; }
.time { font-size: 16px; font-family: "Times New Roman", serif; font-weight: 700; }
.acc { font-size: 14px; font-family: "Times New Roman", serif; }
.chord { font-size: 13px; font-family: "Yu Gothic UI", Meiryo, sans-serif; font-weight: 700; }
.ly { font-size: 12px; text-anchor: middle; font-family: "Yu Gothic UI", Meiryo, sans-serif; }
.show { font-size: 13px; font-family: "Yu Mincho", serif; fill: #5c5146; }
.mno { font-size: 10px; fill: #8a7d6e; font-family: "Yu Gothic UI", sans-serif; }
.rest { font-size: 16px; font-family: "Segoe UI Symbol", "Noto Music", serif; }
.links a { color: #9a3b32; margin-right: 14px; font-family: "Yu Gothic UI", Meiryo, sans-serif; }
footer { padding: 12px 8vw 40px; color: #6b5f53; font-size: 14px; }
"""

PAGE_JS = r"""
let ctx;
let timers = [];
let stopAt = 0;
function ensure() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function silence() {
  timers.forEach(id => clearTimeout(id));
  timers = [];
  if (ctx) ctx.close().catch(() => {});
  ctx = null;
  document.querySelectorAll(".play").forEach(b => { b.textContent = "再生"; b.classList.remove("stop"); });
  document.querySelectorAll(".seg.on").forEach(s => s.classList.remove("on"));
}
function tone(audio, when, dur, midi, vel, pad) {
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = pad ? "triangle" : "sine";
  o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vel, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.05, dur));
  o.connect(g); g.connect(audio.destination);
  o.start(when); o.stop(when + dur + 0.02);
}
function play(id) {
  const btn = document.querySelector(`[data-play="${id}"]`);
  if (btn.classList.contains("stop")) { silence(); return; }
  silence();
  const data = JSON.parse(document.getElementById("data-" + id).textContent);
  const audio = ensure();
  const t0 = audio.currentTime + 0.08;
  data.notes.forEach(n => tone(audio, t0 + n.t, n.d, n.m, n.v, n.p === 1));
  btn.textContent = "停止";
  btn.classList.add("stop");
  const segs = document.querySelectorAll(`#song-${id} .seg`);
  const started = performance.now();
  const tick = () => {
    if (!btn.classList.contains("stop")) return;
    const sec = (performance.now() - started) / 1000;
    const label = document.querySelector(`#song-${id} .now`);
    let cur = data.sections[0];
    data.sections.forEach((s, i) => { if (sec >= s.t) cur = s; });
    segs.forEach(s => s.classList.remove("on"));
    const idx = data.sections.indexOf(cur);
    if (segs[idx]) segs[idx].classList.add("on");
    const mm = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60);
    label.textContent = `${cur.label}　${mm}:${String(ss).padStart(2, "0")}`;
    if (sec < data.sec) requestAnimationFrame(tick);
    else silence();
  };
  requestAnimationFrame(tick);
}
"""


def render_html(songs_view: list):
    toc = []
    articles = []
    for s in songs_view:
        toc.append(
            f'<a href="#song-{s["no"]:02d}"><span class="no">{s["no"]:02d}</span>{html.escape(s["title"])}'
            f'<small>{html.escape(s["key_name"])}　{s["bpm"]} BPM　{html.escape(s["length"])}</small></a>'
        )
        blocks = []
        for sec in s["drawn"]:
            poem = "".join(f"<div>{html.escape(line)}</div>" for line in sec["poem"])
            poem_html = f'<div class="poem">{poem}</div>' if poem else ""
            blocks.append(
                f'<div class="block"><h3>{html.escape(sec["label"])}</h3>{poem_html}{sec["svg"]}</div>'
            )
        articles.append(
            f'''<article id="song-{s["no"]:02d}">
<h2>{s["no"]:02d}　{html.escape(s["title"])}</h2>
<p class="meta">{html.escape(s["key_name"])}（{html.escape(s["key"])}）　4/4　♩={s["bpm"]}　{s["bars"]}小節　{html.escape(s["length"])}（{s["seconds"]:.1f}秒）</p>
<p class="arch">{html.escape(s["archetype"])}</p>
<p>
<button class="play" data-play="{s["no"]:02d}" onclick="play('{s["no"]:02d}')">再生</button>
<span class="now"></span>
</p>
{s["timeline"]}
<h3>歌詞</h3>
<div class="poem">{s["lyrics_html"]}</div>
<h3>楽譜</h3>
<p class="meta">音符の下にひらがな、その下に漢字の語句。反復区間は構成表のとおり。</p>
{"".join(blocks)}
<p class="links"><a href="{s["abc"]}">ABC楽譜</a><a href="{s["mid"]}">MIDI</a><a href="{s["txt"]}">歌詞テキスト</a></p>
<script type="application/json" id="data-{s["no"]:02d}">{s["json"]}</script>
</article>'''
        )
    n = len(songs_view)
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>オリジナル曲 {n}曲</title>
<style>{PAGE_CSS}</style>
</head>
<body>
<header class="book">
<h1>オリジナル曲 {n}曲</h1>
<p>人気のアニソンとボカロに繰り返し出てくるテンポ、4/4、曲の長さ、Aメロ8小節・Bメロ8小節・サビという並びを器にしています。メロディと歌詞はすべてこのための書き下ろしで、既存曲の複製ではありません。</p>
<p>1曲目から10曲目はアニソンとボカロの尺を混ぜた最初の10曲。11曲目から30曲目はボカロ向けで、テンポは72から192まで散らしてあります。31曲目から36曲目は歌詞が多い版で、1小節に8モーラを置き、Aメロ3、サビ2、Cメロまで行を変えています。各曲の下に小節数と開始時刻を置いています。</p>
</header>
<nav class="toc">{"".join(toc)}</nav>
{"".join(articles)}
<footer>リードシート（メロディ・コード・歌詞）。イントロと間奏は、注記のないかぎりサビのメロディを歌わずに演奏します。最後の小節は主和音で終えます。</footer>
<script>{PAGE_JS}</script>
</body>
</html>
'''


def song_files(song: dict):
    by_id = resolve_sections(song)
    expanded = []
    for sid in song["form"]:
        expanded.append(by_id[sid])
    bars_n = sum(len(s["bars"]) for s in expanded)
    seconds = bars_n * 4 * 60 / song["bpm"]
    warns = strong_beat_warnings(song, by_id)
    slug = f'{song["no"]:02d}_{song["slug"]}'
    abc_rel = f"abc/{slug}.abc"
    mid_rel = f"midi/{slug}.mid"
    txt_rel = f"lyrics/{slug}.txt"
    (ROOT / "abc").mkdir(exist_ok=True)
    (ROOT / "midi").mkdir(exist_ok=True)
    (ROOT / "lyrics").mkdir(exist_ok=True)
    (ROOT / abc_rel).write_text(render_abc(song), encoding="utf-8")
    write_midi(ROOT / mid_rel, song, expanded)
    lyric_body = (
        f'{song["title"]}\n{song["key_name"]} / {song["bpm"]} BPM / {bars_n}小節 / {fmt_time(seconds)}\n'
        f'{song["archetype"]}\n\n{performed_lyrics(expanded)}\n'
    )
    (ROOT / txt_rel).write_text(lyric_body, encoding="utf-8")
    drawn = []
    for s in song["sections"]:
        if s.get("from") and not s.get("resolve"):
            continue
        drawn.append({"label": s["label"], "poem": poem_lines(s), "svg": svg_section(song, s)})
    lyrics_html = performed_lyrics(expanded).replace("\n", "<br/>")
    # performed_lyrics is plain; escape then restore br
    lyrics_html = html.escape(performed_lyrics(expanded)).replace("\n", "<br/>")
    payload = player_notes(song, expanded)
    return {
        "no": song["no"],
        "title": song["title"],
        "key": song["key"],
        "key_name": song["key_name"],
        "bpm": song["bpm"],
        "bars": bars_n,
        "seconds": seconds,
        "length": fmt_time(seconds),
        "archetype": song["archetype"],
        "timeline": timeline(song, expanded),
        "lyrics_html": lyrics_html,
        "drawn": drawn,
        "abc": abc_rel,
        "mid": mid_rel,
        "txt": txt_rel,
        "json": json.dumps(payload, ensure_ascii=False).replace("<", "\\u003c"),
        "warns": warns,
    }


# ---------- 10曲 ----------

def build_catalog():
    songs = []

    songs.append({
        "no": 1, "slug": "yoake_no_signal", "title": "夜明けのシグナル",
        "key": "A", "abc_key": "A", "key_name": "イ長調", "flats": False, "bpm": 172,
        "archetype": "王道アニソンOPのTVサイズ。BPM170前後の4/4で、64小節だと約89秒になる。Aメロ8、Bメロ8、サビは歌い出しから50秒前後。8分音符が走る。",
        "form": ["intro", "A", "B", "chorus", "chorus", "break", "chorus", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus"),
            section("A", "Aメロ", [
                ("A", "E4 E4 G#4 A4 A4:2 G#4:2", "ま ど を あ け て", "窓を開けて"),
                ("D", "F#4 A4 A4 F#4 F#4:2 E4:2", "ひ か り が ふ る", "光が降る"),
                ("F#m", "A4 A4 B4 C#5 C#5:2 A4:2", "な ま え を よ ぶ", "名前を呼ぶ"),
                ("E", "G#4 A4 G#4 F#4 E4:2 E4:2", "こ え は と お く", "声は遠く"),
                ("A", "E4 E4 G#4 A4 A4:2 E4:2", "く つ ひ も む す び", "靴ひも結び"),
                ("Bm", "B4 C#5 B4 A4 F#4:2 D4:2", "か ど を ま が る", "角を曲がる"),
                ("D", "F#4 G#4 A4 B4 A4:2 F#4:2", "きょ う の そ ら が", "今日の空が"),
                ("E", "E4 F#4 G#4 E4 E4:2 E4:2", "ぼ く を ま つ よ", "僕を待つよ"),
            ]),
            section("B", "Bメロ", [
                ("D", "F#4 A4 B4 A4 F#4 A4 A4 F#4", "は し り だ す た び に", "走り出すたびに"),
                ("A", "E4 E4 G#4 A4 A4 G#4 E4 E4", "む ね が あ つ く な る", "胸が熱くなる"),
                ("F#m", "A4 C#5 C#5 B4 A4 B4 A4 F#4", "ま け た く な い っ て", "負けたくないって"),
                ("E", "G#4 B4 B4 A4 G#4 F#4 E4 E4", "く ち を つ い て で る", "口をついて出る"),
                ("D", "A4 A4 B4 C#5 D5 C#5 B4 A4", "と お い ゆ め は ま だ", "遠い夢はまだ"),
                ("Bm", "B4 D5 C#5 B4 B4 A4 F#4 D4", "ぼ ん や り だ け ど ね", "ぼんやりだけどね"),
                ("E", "G#4 A4 B4 G#4 G#4 F#4 E4 E4", "そ れ で も あ し は ね", "それでも足はね"),
                ("E", "B4 A4 G#4 F#4 E4 F#4 G#4 E4", "ま え を む い て く よ", "前を向いてくよ"),
            ]),
            section("chorus", "サビ", [
                ("A", "E4 E4 G#4 A4 C#5 A4 G#4 E4", "こ こ ろ の シ グ ナ ル", "心のシグナル"),
                ("E", "B4 B4 A4 G#4 G#4 F#4 E4 B4", "よ る を さ い て ゆ く", "夜を裂いてゆく"),
                ("F#m", "C#5 C#5 B4 A4 A4 G#4 F#4 A4", "ま だ み ぬ あ す へ と", "まだ見ぬ明日へと"),
                ("D", "A4 B4 C#5 A4 F#4 G#4 A4 F#4", "て を の ば し て み る", "手を伸ばしてみる"),
                ("A", "E5 D5 C#5 B4 C#5 D5 E5 C#5", "こ ろ ん で も い い よ", "転んでもいいよ"),
                ("E", "E5 D5 B4 G#4 G#4 A4 B4 G#4", "ひ か り を め ざ し て", "光を目指して"),
                ("D", "A4 B4 C#5 D5 D5 C#5 B4 A4", "ぼ く ら は も う い る", "僕らはもういる"),
                ("E", "E4 G#4 B4 G#4 E4 F#4 E4 E4", "は し り だ し て る よ", "走り出してるよ"),
            ]),
            derived("break", "間奏", "chorus", take=4),
            derived("outro", "アウトロ", "chorus", take=4, resolve=("A", "A4")),
        ],
    })

    songs.append({
        "no": 2, "slug": "shizukana_yakusoku", "title": "静かな約束",
        "key": "F", "abc_key": "F", "key_name": "ヘ長調", "flats": True, "bpm": 80,
        "archetype": "静かなアニソンEDのTVサイズ。BPM80、30小節で90秒。4分音符が歩幅になって、サビで同じ言葉を二度置く。",
        "form": ["intro", "A", "chorus", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus", take=4),
            section("A", "Aメロ", [
                ("F", "A4:2 C5:2 A4:2 F4:2", "あ さ の ひ に", "朝の日に"),
                ("Bb", "Bb4:2 C5:2 Bb4:2 A4:2", "て を の ば す", "手を伸ばす"),
                ("F", "A4:2 C5:2 A4:2 C5:2", "き み の な を", "きみの名を"),
                ("C", "C5:2 Bb4:2 G4:2 E4:2", "よ ん で る よ", "呼んでるよ"),
                ("Dm", "F4:2 A4:2 D5:2 A4:2", "ま ど べ で ね", "窓辺でね"),
                ("Bb", "Bb4:2 C5:2 Bb4:2 A4:2", "か ぜ が ふ く", "風が吹く"),
                ("F", "A4:2 G4:2 F4:2 G4:2", "こ の ね を ね", "この音をね"),
                ("C", "E4:2 F4:2 G4:2 E4:2", "き え さ な い", "消さないで"),
            ]),
            section("chorus", "サビ", [
                ("F", "A4:2 C5:2 A4:2 F4:2", "と な り で ね", "隣でね"),
                ("Bb", "Bb4:2 C5:2 Bb4:2 A4:2", "す わ る よ う", "座るように"),
                ("F", "C5:2 D5:2 C5:2 A4:2", "は な そ う よ", "話そうよ"),
                ("C", "C5:2 Bb4:2 G4:2 E4:2", "よ る ま で も", "夜までも"),
                ("F", "A4:2 C5:2 F5:2 C5:2", "な み だ は ね", "涙はね"),
                ("Dm", "D5:2 A4:2 F4:2 D4:2", "か わ い て も", "乾いても"),
                ("C", "G4:2 E4:2 G4:2 C5:2", "こ の て を ね", "この手をね"),
                ("F", "A4:2 G4:2 F4:2 F4:2", "に ぎ る よ う", "握るよう"),
            ]),
            section("outro", "アウトロ", [
                ("C", "C5:4 G4:4"),
                ("F", "F4:8"),
            ]),
        ],
    })

    songs.append({
        "no": 3, "slug": "neon_no_kokyu", "title": "ネオンの呼吸",
        "key": "Dm", "abc_key": "Dm", "key_name": "ニ短調", "flats": True, "bpm": 128,
        "archetype": "ボカロのエレクトロ。BPM128、112小節で3分30秒。小節頭を休符にして裏から入る。A8、B8、サビ16を二周し、ブリッジを挟む。",
        "form": ["intro", "A", "B", "chorus", "chorus", "break", "A", "B", "chorus", "chorus", "bridge", "bridge2", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus"),
            section("A", "Aメロ", [
                ("Dm", "r F4 A4 A4:2 G4 F4 E4", "ま ち の ね い ろ が", "街の音色が"),
                ("Bb", "r F4 G4 Bb4:2 A4 G4 F4", "きょ う め い す る よ", "共鳴するよ"),
                ("F", "r A4 C5 A4:2 G4 F4 E4", "く ち び る か ら ね", "唇からね"),
                ("C", "r G4 E4 G4:2 F4 E4 D4", "こ え が も れ る よ", "声が漏れるよ"),
                ("Dm", "r F4 A4 A4:2 G4 F4 E4", "が ら す ご し に ね", "ガラス越しにね"),
                ("Gm", "r G4 Bb4 Bb4:2 A4 G4 F4", "ひ か り が ふ る よ", "光が降るよ"),
                ("Bb", "r F4 A4 Bb4:2 C5 Bb4 A4", "い き を す っ て ね", "息を吸ってね"),
                ("A", "r E4 C#5 A4:2 E4 D4 D4", "う た に か え る よ", "歌に変えるよ"),
            ]),
            section("B", "Bメロ", [
                ("Bb", "r F4 A4 Bb4:2 D5 C5 Bb4", "あ し ぶ み し て る", "足踏みしてる"),
                ("F", "r A4 C5 C5:2 A4 G4 F4", "し ん ご う ま ち さ", "信号待ちさ"),
                ("C", "r E4 G4 G4:2 A4 G4 E4", "あ お に な る よ ね", "青になるよね"),
                ("Dm", "r F4 A4 A4:2 C5 A4 F4", "む ね が は や る よ", "胸が逸るよ"),
                ("Bb", "r Bb4 D5 D5:2 C5 Bb4 A4", "か ぞ え て く よ ね", "数えてくよね"),
                ("F", "r A4 C5 C5:2 A4 G4 F4", "ひ か り の ほ う へ", "光のほうへ"),
                ("C", "r G4 G4 E4:2 G4 Bb4 G4", "て を ふ っ て く よ", "手を振ってくよ"),
                ("A", "r E4 C#5 A4:2 E4 D4 D4", "う た い だ す よ ね", "歌い出すよね"),
            ]),
            section("chorus", "サビ", [
                ("Dm", "r A4 C5 D5:2 C5 A4 F4", "こ え を あ わ せ て", "声を合わせて"),
                ("Bb", "r Bb4 D5 F4:2 D5 Bb4 A4", "ま ち の こ ど う さ", "街の鼓動さ"),
                ("F", "r C5 A4 F4:2 G4 A4 C5", "わ た し は い る よ", "わたしはいるよ"),
                ("C", "r G4 G4 E4:2 D4 C4 C4", "い き を す る よ ね", "息をするよね"),
                ("Dm", "r A4 C5 D5:2 A4 F4 D4", "こ わ れ て も ね え", "壊れてもねえ"),
                ("Gm", "r Bb4 A4 G4:2 F4 D4 D4", "う た は の こ る よ", "歌は残るよ"),
                ("Bb", "r D5 C5 Bb4:2 A4 G4 F4", "よ る を こ え て く", "夜を越えてく"),
                ("A", "r E4 C#5 A4:2 E4 D4 D4", "う た い だ そ う よ", "歌い出そうよ"),
            ]),
            derived("break", "間奏", "chorus"),
            section("bridge", "ブリッジ", [
                ("Dm", "F4:2 A4:2 D5:2 A4:2", "も し も ね え", "もしもねえ"),
                ("Bb", "Bb4:2 A4:2 G4:2 F4:2", "き え そ う で", "消えそうで"),
                ("F", "A4:2 C5:2 A4:2 F4:2", "で も ま だ ね", "でもまだね"),
                ("C", "G4:2 A4:2 G4:2 E4:2", "う た が あ る", "歌がある"),
                ("Dm", "D4:2 F4:2 A4:2 F4:2", "む ね の お く", "胸の奥"),
                ("Gm", "G4:2 A4:2 Bb4:2 A4:2", "ち い さ く ね", "小さくね"),
                ("Bb", "Bb4:2 C5:2 D5:2 Bb4:2", "ひ び い て る", "響いてる"),
                ("A", "E4:2 C#5:2 A4:2 A4:2", "き こ え る よ", "聞こえるよ"),
            ]),
            section("bridge2", "ブリッジ", [
                ("Dm", "F4:2 A4:2 D5:2 F4:2", "も う い ち ど", "もう一度"),
                ("Bb", "Bb4:2 A4:2 G4:2 F4:2", "こ え を だ す", "声を出す"),
                ("F", "A4:2 C5:2 A4:2 F4:2", "よ る の そ ら", "夜の空"),
                ("C", "G4:2 E4:2 G4:2 C5:2", "こ た え る よ", "応えるよ"),
                ("Dm", "D4:2 F4:2 A4:2 D5:2", "わ た し の ね", "わたしのね"),
                ("Gm", "G4:2 Bb4:2 A4:2 G4:2", "な ま え を ね", "名前をね"),
                ("Bb", "Bb4:2 D5:2 C5:2 Bb4:2", "き い て て ね", "聞いててね"),
                ("A", "E4:2 C#5:2 A4:2 A4:2", "ほ し い よ ね", "ほしいよね"),
            ]),
            derived("outro", "アウトロ", "chorus", resolve=("Dm", "D4")),
        ],
    })

    songs.append({
        "no": 4, "slug": "kuhaku_no_outline", "title": "空白のアウトライン",
        "key": "Em", "abc_key": "Em", "key_name": "ホ短調", "flats": False, "bpm": 168,
        "archetype": "ボカロロック。BPM168、144小節で3分26秒。ストレートな8分音符。Aメロは言葉数を落とし、サビで音域を上げる。",
        "form": ["intro", "A", "B", "chorus", "chorus", "break", "A2", "B", "chorus", "chorus", "bridge", "chorus", "break", "A", "B", "chorus", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus"),
            section("A", "Aメロ", [
                ("Em", "E4 E4 G4 A4 B4:2 G4:2", "な に も な い よ", "何もないよ"),
                ("C", "G4 G4 E4 D4 E4:2 E4:2", "デ ス ク の う え", "デスクのうえ"),
                ("G", "B4 B4 A4 G4 B4:2 D5:2", "し ろ い か み に", "白い紙に"),
                ("D", "A4 A4 F#4 E4 D4:2 D4:2", "ひ と り だ よ ね", "ひとりだよね"),
                ("Em", "E4 G4 B4 A4 G4:2 E4:2", "み み を す ま せ", "耳をすませ"),
                ("C", "E4 G4 A4 G4 E4:2 D4:2", "よ る が ひ び く", "夜が響く"),
                ("G", "B4 B4 A4 G4 G4:2 D4:2", "か き は じ め る", "書き始める"),
                ("D", "A4 F#4 E4 D4 D4:2 A4:2", "そ の て で い ま", "その手でいま"),
            ]),
            section("A2", "Aメロ2", [
                ("Em", "E4 E4 G4 A4 B4:2 G4:2", "ま ど に え が く", "窓に描く"),
                ("C", "G4 G4 E4 D4 E4:2 E4:2", "ほ そ い せ ん を", "細い線を"),
                ("G", "B4 B4 A4 G4 B4:2 D5:2", "ま ち が え て も", "間違えても"),
                ("D", "A4 A4 F#4 E4 D4:2 D4:2", "け せ る か ら ね", "消せるからね"),
                ("Em", "E4 G4 B4 A4 G4:2 E4:2", "こ わ く な い よ", "怖くないよ"),
                ("C", "E4 G4 A4 G4 E4:2 D4:2", "し ろ が ま も る", "白が守る"),
                ("G", "B4 B4 A4 G4 G4:2 D4:2", "あ し た の ぶ ん", "明日の分"),
                ("D", "A4 F#4 E4 D4 D4:2 A4:2", "か き た そ う よ", "描き足そうよ"),
            ]),
            section("B", "Bメロ", [
                ("Am", "A4 C5 C5 B4 A4 G4 A4 E4", "む ね の お く が な る", "胸の奥が鳴る"),
                ("Em", "E4 G4 G4 A4 B4 A4 G4 E4", "ま だ な ま え の な い", "まだ名前のない"),
                ("C", "G4 G4 A4 G4 E4 G4 A4 C5", "う た が ほ し い ん だ", "歌がほしいんだ"),
                ("D", "F#4 A4 A4 G4 F#4 E4 F#4 A4", "こ え に な ら な く て", "声にならなくて"),
                ("Em", "B4 B4 A4 G4 B4 D5 B4 G4", "ゆ び が ふ る え て も", "指がふるえても"),
                ("C", "E4 G4 A4 G4 E4 D4 E4 G4", "せ ん は ま っ す ぐ で", "線は真っ直ぐで"),
                ("G", "B4 D5 B4 G4 G4 A4 B4 D5", "は し ま で ひ い て く", "端まで引いてく"),
                ("B7", "F#4 G4 A4 B4 A4 F#4 D#4 E4", "い っ しょ に う た お う", "いっしょに歌おう"),
            ]),
            section("chorus", "サビ", [
                ("Em", "E4 G4 G4 A4 B4 A4 G4 E4", "く う は く の ま ま で", "空白のままで"),
                ("C", "E4 G4 A4 G4 E4 D4 E4 G4", "そ の ア ウ ト ラ イ ン", "そのアウトライン"),
                ("G", "B4 B4 A4 G4 B4 A4 G4 D4", "く ろ い キャ ン バ ス に", "黒いキャンバスに"),
                ("D", "A4 A4 G4 F#4 F#4 E4 D4 A4", "い ろ を ぬ り た く て", "色を塗りたくて"),
                ("Em", "E4 G4 B4 D5 B4 G4 E4 D4", "ま ち が っ て も い い", "間違ってもいい"),
                ("C", "G4 A4 G4 E4 E4 D4 C4 E4", "け せ ば い い だ け さ", "消せばいいだけさ"),
                ("Am", "A4 C5 B4 A4 A4 G4 A4 E4", "り ん か く を え が く", "輪郭を描く"),
                ("B7", "F#4 A4 B4 A4 F#4 D#4 E4 E4", "い ま ひ き は じ め る", "今引き始める"),
            ]),
            section("bridge", "ブリッジ", [
                ("Em", "E4 E4 G4 B4 D5 B4 G4 E4", "け っ きょ く じ ぶ ん の", "結局自分の"),
                ("C", "G4 E4 G4 A4 G4 E4 D4 C4", "せ ん で い い ん だ よ", "線でいいんだよ"),
                ("G", "B4 B4 A4 G4 G4 A4 B4 G4", "た だ し く な く て も", "正しくなくても"),
                ("D", "F#4 A4 D5 A4 F#4 E4 D4 D4", "と ど け ば い い ん だ", "届けばいいんだ"),
                ("Am", "A4 C5 E5 C5 A4 G4 A4 E4", "し ろ い か み の う え", "白い紙のうえ"),
                ("C", "G4 A4 G4 E4 E4 D4 C4 E4", "きょ う を の こ そ う よ", "今日を残そうよ"),
                ("D", "F#4 A4 D5 A4 F#4 E4 D4 D4", "み え な い ラ イ ン を", "見えないラインを"),
                ("B7", "B4 F#4 D#4 B4 A4 F#4 E4 E4", "ひ い て み せ る か ら", "引いてみせるから"),
            ]),
            derived("break", "間奏", "chorus"),
            derived("outro", "アウトロ", "chorus", resolve=("Em", "E4")),
        ],
    })

    songs.append({
        "no": 5, "slug": "hokago_orbit", "title": "放課後オービット",
        "key": "G", "abc_key": "G", "key_name": "ト長調", "flats": False, "bpm": 120,
        "archetype": "青春アニソンのフルサイズ。BPM120なら120小節でちょうど4分。A8、B8、サビ8を二番まで進めて、ブリッジのあとサビを重ねる。",
        "form": ["intro", "A", "B", "chorus", "chorus", "A2", "B", "chorus", "chorus", "bridge", "chorus", "chorus", "break", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus"),
            section("A", "Aメロ", [
                ("G", "G4 G4 B4 D5 B4:2 G4:2", "ちゃ い む が な る", "チャイムが鳴る"),
                ("D", "F#4 A4 A4 F#4 D4:2 D4:2", "か ば ん を と る", "かばんを取る"),
                ("Em", "E4 G4 G4 B4 G4:2 E4:2", "ろ う か を ゆ く", "廊下をゆく"),
                ("C", "E4 G4 G4 E4 C4:2 E4:2", "き み が い る よ", "きみがいるよ"),
                ("G", "D5 B4 G4 A4 B4:2 G4:2", "へ い こ う せ ん", "平行線"),
                ("Em", "E4 G4 B4 G4 E4:2 D4:2", "ゆ び さ き か ら", "指先から"),
                ("Am", "A4 C5 C5 B4 A4:2 E4:2", "せ か い が ま う", "世界が舞う"),
                ("D", "F#4 A4 A4 F#4 D4:2 D4:2", "ほ う か ご だ よ", "放課後だよ"),
            ]),
            section("A2", "Aメロ2", [
                ("G", "G4 G4 B4 D5 B4:2 G4:2", "しゃ し ん を と る", "写真を撮る"),
                ("D", "F#4 A4 A4 F#4 D4:2 D4:2", "に じ む ひ か り", "にじむ光"),
                ("Em", "E4 G4 G4 B4 G4:2 E4:2", "え き の ホ ー ム", "駅のホーム"),
                ("C", "E4 G4 G4 E4 C4:2 E4:2", "ま つ つ も り だ", "待つつもりだ"),
                ("G", "D5 B4 G4 A4 B4:2 G4:2", "で ん しゃ が き て", "電車が来て"),
                ("Em", "E4 G4 B4 G4 E4:2 D4:2", "ど あ が あ く よ", "ドアが開くよ"),
                ("Am", "A4 C5 C5 B4 A4:2 E4:2", "の り こ む よ う", "乗り込むよう"),
                ("D", "F#4 A4 A4 F#4 D4:2 D4:2", "き み と ふ た り", "きみとふたり"),
            ]),
            section("B", "Bメロ", [
                ("G", "G4 B4 D5 B4 G4 A4 B4 D5", "ゆ う ひ が レ ー ル に", "夕日がレールに"),
                ("D", "F#4 A4 C5 A4 F#4 E4 D4 F#4", "な が い か げ を お く", "長いかげを置く"),
                ("Em", "G4 B4 B4 G4 E4 G4 B4 D5", "わ た し の ホ ー ム は", "わたしのホームは"),
                ("C", "E4 G4 G4 E4 C4 D4 E4 G4", "き み の ま え に あ る", "きみの前にある"),
                ("G", "D5 D5 B4 G4 B4 D5 E5 D5", "ち い さ な う ちゅ う が", "小さな宇宙が"),
                ("Em", "E4 G4 B4 G4 E4 D4 E4 G4", "ほ う か ご に ひ ら く", "放課後に開く"),
                ("Am", "A4 C5 E5 C5 A4 G4 A4 E4", "て を ふ れ ば そ ら が", "手を振れば空が"),
                ("D", "F#4 A4 C5 A4 F#4 D4 E4 F#4", "ぐ る っ と ま わ る よ", "ぐるっと回るよ"),
            ]),
            section("chorus", "サビ", [
                ("G", "G4 B4 D5 D5 B4 G4 A4 B4", "オ ー ビ ッ ト の よ る", "オービットの夜"),
                ("D", "A4 A4 F#4 D4 F#4 A4 C5 A4", "き み と ま わ ろ う よ", "きみと回ろうよ"),
                ("Em", "B4 G4 E4 G4 B4 D5 B4 G4", "ち ず に な い み ち を", "地図にない道を"),
                ("C", "E4 G4 C5 E5 C5 G4 E4 C4", "な ら ん で あ る こ う", "並んであるこう"),
                ("G", "D5 B4 G4 B4 D5 B4 A4 G4", "しゅ く だ い の そ と へ", "宿題の外へ"),
                ("Em", "E4 G4 B4 D5 B4 G4 E4 D4", "ひ か り が ま っ て る", "光が待ってる"),
                ("C", "E4 G4 C5 E5 E5 D5 C5 G4", "あ し た も こ こ で ね", "明日もここでね"),
                ("D", "F#4 A4 C5 D5 A4 F#4 D4 D4", "な ま え を よ ぶ か ら", "名前を呼ぶから"),
            ]),
            section("bridge", "ブリッジ", [
                ("Am", "A4 C5 B4 A4 E4 A4 C5 A4", "き み が と お く て も", "きみが遠くても"),
                ("C", "G4 E4 C4 E4 G4 A4 G4 E4", "お な じ そ ら を み る", "同じ空を見る"),
                ("G", "B4 D5 B4 G4 D5 B4 G4 D4", "で ん ぱ み た い に ね", "電波みたいにね"),
                ("D", "A4 F#4 D4 F#4 A4 C5 A4 F#4", "こ え は つ な が る よ", "声はつながるよ"),
                ("Am", "E4 A4 C5 A4 E4 D4 E4 A4", "ほ う か ご の きょ り は", "放課後の距離は"),
                ("C", "G4 G4 E4 C4 E4 G4 C5 G4", "ぜ ろ に な る か ら ね", "ゼロになるからね"),
                ("G", "B4 B4 D5 B4 G4 A4 B4 D5", "う で を の ば す だ け", "腕を伸ばすだけ"),
                ("D", "A4 F#4 E4 D4 F#4 A4 D5 D4", "と ど く きょ り だ よ ね", "届く距離だよね"),
            ]),
            derived("break", "間奏", "chorus"),
            derived("outro", "アウトロ", "chorus", resolve=("G", "G4")),
        ],
    })

    songs.append({
        "no": 6, "slug": "candy_eisei", "title": "キャンディ衛星",
        "key": "Bb", "abc_key": "Bb", "key_name": "変ロ長調", "flats": True, "bpm": 150,
        "archetype": "かわいい系のボカロ。BPM150、128小節で3分25秒。短・短・長の跳ねる刻みと、サビだけまっすぐな8分。",
        "form": ["intro", "A", "B", "chorus", "chorus", "break", "A2", "B", "chorus", "chorus", "bridge", "chorus", "chorus", "break", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "A"),
            section("A", "Aメロ", [
                ("Bb", "Bb4 D5 Bb4:2 F4 Bb4 D5:2", "あ ま い で ん ぱ が", "甘い電波が"),
                ("F", "F4 A4 C5:2 A4 F4 C5:2", "そ ら へ お く る よ", "空へ送るよ"),
                ("Gm", "G4 Bb4 D5:2 Bb4 G4 Bb4:2", "ポ ケ ッ ト ふ る よ", "ポケットふるよ"),
                ("Eb", "Eb4 G4 Bb4:2 G4 Eb4 G4:2", "あ ま い か お り が", "甘い香りが"),
                ("Bb", "D5 Bb4 F4:2 D4 Bb4 D5:2", "え い せ い ご し に", "衛星ごしに"),
                ("Gm", "Bb4 G4 D4:2 Bb4 G4 D5:2", "ほ し が ふ る え る", "星がふるえる"),
                ("Cm", "C5 Eb5 C5:2 G4 Eb4 C5:2", "な ま え を よ ぶ よ", "名前を呼ぶよ"),
                ("F", "A4 F4 C5:2 A4 F4 F4:2", "き み の こ と を ね", "きみのことをね"),
            ]),
            section("A2", "Aメロ2", [
                ("Bb", "Bb4 D5 Bb4:2 F4 Bb4 D5:2", "あ ま い し ん ご う", "甘い信号"),
                ("F", "F4 A4 C5:2 A4 F4 C5:2", "も う い ち ど ね", "もう一度ね"),
                ("Gm", "G4 Bb4 D5:2 Bb4 G4 Bb4:2", "ピ ン ク く も が ね", "ピンク雲がね"),
                ("Eb", "Eb4 G4 Bb4:2 G4 Eb4 G4:2", "わ た し を の せ て", "わたしを乗せて"),
                ("Bb", "D5 Bb4 F4:2 D4 Bb4 D5:2", "か い だ ん の ぼ る", "階段のぼる"),
                ("Gm", "Bb4 G4 D4:2 Bb4 G4 D5:2", "ひ か り の ほ う へ", "光のほうへ"),
                ("Cm", "C5 Eb5 C5:2 G4 Eb4 C5:2", "て を ふ る か ら ね", "手を振るからね"),
                ("F", "A4 F4 C5:2 A4 F4 F4:2", "よ く み え る よ ね", "よく見えるよね"),
            ]),
            section("B", "Bメロ", [
                ("Eb", "Eb4 G4 Bb4:2 G4 Eb4 Bb4:2", "ほ し を か ぞ え て", "星を数えて"),
                ("Bb", "F4 Bb4 D5:2 Bb4 F4 D5:2", "ひ と つ ず つ ね え", "ひとつずつねえ"),
                ("Gm", "G4 Bb4 D5:2 Bb4 G4 D5:2", "あ ま い さ き っ ぽ", "甘い先っぽ"),
                ("F", "A4 C5 C5:2 A4 F4 A4:2", "そ こ ま で ゆ く よ", "そこまでゆくよ"),
                ("Eb", "G4 Bb4 Eb5:2 Bb4 G4 Eb4:2", "ぜ ろ じ か ら ね え", "ゼロ時からねえ"),
                ("Bb", "D5 Bb4 F4:2 D5 Bb4 F4:2", "よ る が く る よ ね", "夜がくるよね"),
                ("Cm", "C5 Eb5 G4:2 Eb5 C5 G4:2", "じゅ ん び お っ け", "準備おっけ"),
                ("F", "A4 C5 F5:2 C5 A4 F4:2", "う た い だ そ う よ", "歌い出そうよ"),
            ]),
            section("chorus", "サビ", [
                ("Bb", "F4 Bb4 D5 F5 D5 Bb4 D5 C5", "キャ ン ディ え い せ い だ", "キャンディ衛星だ"),
                ("F", "C5 A4 F4 A4 C5 A4 F4 A4", "ひ か り を な げ る よ", "光を投げるよ"),
                ("Gm", "Bb4 D5 D5 Bb4 G4 A4 Bb4 D5", "き み に ふ り そ そ ぐ", "きみに降り注ぐ"),
                ("Eb", "Eb4 G4 Bb4 G4 Eb4 F4 G4 Bb4", "ピ ン ク の あ め が さ", "ピンクの雨傘"),
                ("Bb", "D5 D5 Bb4 F4 Bb4 D5 F5 D5", "こ の う た き い て て", "この歌聴いてて"),
                ("Gm", "G4 Bb4 D5 Bb4 G4 F4 G4 A4", "え い せ い か ら み て", "衛星から見て"),
                ("Cm", "C5 Eb5 C5 G4 G4 Bb4 C5 Eb5", "き み は わ ら っ て る", "きみは笑ってる"),
                ("F", "A4 C5 A4 F4 F4 G4 A4 F4", "わ た し も わ ら う よ", "わたしも笑うよ"),
            ]),
            section("bridge", "ブリッジ", [
                ("Cm", "C4 Eb4 G4:2 Eb4 C4 G4:2", "も し で ん ぱ が ね", "もし電波がね"),
                ("F", "F4 A4 C5:2 A4 F4 C4:2", "と ぎ れ て も ね え", "途切れてもねえ"),
                ("Bb", "Bb4 D5 F4:2 D4 Bb4 F4:2", "あ ま い う た は ね", "甘い歌はね"),
                ("Eb", "Eb4 G4 Bb4:2 G4 Eb4 Bb4:2", "の こ っ て る よ ね", "残ってるよね"),
                ("Cm", "G4 C5 Eb5:2 C5 G4 Eb4:2", "う ちゅ う の そ こ で", "宇宙のそこで"),
                ("Gm", "G4 Bb4 D5:2 Bb4 G4 D4:2", "く る く る ま う よ", "くるくる舞うよ"),
                ("Eb", "Eb4 G4 Bb4:2 G4 Eb4 G4:2", "き み を み つ け て", "きみを見つけて"),
                ("F", "A4 C5 F5:2 C5 A4 F4:2", "う た う か ら ね え", "歌うからねえ"),
            ]),
            derived("break", "間奏", "chorus"),
            derived("outro", "アウトロ", "chorus", resolve=("Bb", "Bb4")),
        ],
    })

    songs.append({
        "no": 7, "slug": "kokuyou_no_phrase", "title": "黒曜のフレーズ",
        "key": "Am", "abc_key": "Am", "key_name": "イ短調", "flats": False, "bpm": 160,
        "archetype": "バトル系アニソンのTVサイズ。BPM160、60小節で90秒。短調で、サビの頭は根音から5度へ跳ぶ。",
        "form": ["intro", "A", "B", "chorus", "chorus", "break", "chorus", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus", take=4),
            section("A", "Aメロ", [
                ("Am", "A4 C5 C5 B4 A4 G4 A4 E4", "や み の か た ち だ よ", "闇の形だよ"),
                ("F", "A4 A4 G4 F4 E4 F4 G4 A4", "こ ど う が は し る よ", "鼓動が走るよ"),
                ("C", "G4 G4 A4 G4 E4 D4 E4 G4", "ほ の お を た も っ て", "炎を保って"),
                ("G", "B4 B4 A4 G4 D4 E4 F4 G4", "ま え に い る き み へ", "前にいるきみへ"),
                ("Am", "A4 E4 A4 C5 E5 C5 A4 E4", "こ え じゃ お そ い か ら", "声じゃ遅いから"),
                ("Dm", "D4 F4 A4 F4 D4 E4 F4 A4", "お ん ぷ で ひ ら く よ", "音符で開くよ"),
                ("E", "E4 G#4 B4 G#4 E4 F4 E4 D4", "こ わ く て も い い よ", "怖くてもいいよ"),
                ("E", "B4 G#4 E4 B4 E4 F4 E4 E4", "め を あ げ た ま ま で", "目を上げたままで"),
            ]),
            section("B", "Bメロ", [
                ("F", "A4 C5 C5 A4 F4 G4 A4 C5", "い き を の ん で い く", "息をのんでいく"),
                ("C", "G4 G4 E4 G4 C5 B4 A4 G4", "か ぞ え て ふ み こ む", "数えて踏み込む"),
                ("G", "B4 D5 D5 B4 G4 A4 B4 G4", "ゆ か が ひ び く よ う", "床が響くよう"),
                ("E", "E4 G#4 B4 E5 B4 G#4 E4 D4", "あ し な み そ ろ え て", "足並みそろえて"),
                ("Am", "A4 C5 E5 C5 A4 G4 A4 E4", "む ね の ほ の う が ね", "胸の炎がね"),
                ("Dm", "F4 A4 A4 F4 D4 E4 F4 G4", "う た に な る ま え に", "歌になる前に"),
                ("E", "G#4 B4 B4 G#4 E4 F4 G#4 B4", "く ち び る う ご く よ", "唇動くよ"),
                ("E", "E5 D5 C5 B4 G#4 A4 B4 E4", "い ま こ こ で ひ ら け", "今ここで開け"),
            ]),
            section("chorus", "サビ", [
                ("Am", "A4 C5 E5 E5 C5 A4 B4 C5", "や み を き り さ く よ", "闇を切り裂くよ"),
                ("F", "A4 A4 C5 A4 F4 G4 A4 C5", "こ こ ろ の エ ッ ジ で", "心のエッジで"),
                ("C", "E4 G4 C5 E5 C5 B4 G4 E4", "ひ る ま な い ま ま で", "ひるまないままで"),
                ("G", "B4 D5 D5 B4 G4 A4 B4 D5", "ま え へ ふ み だ そ う", "前へ踏み出そう"),
                ("Am", "E5 C5 A4 C5 E5 D5 C5 A4", "こ ど う を か さ ね て", "鼓動を重ねて"),
                ("Dm", "A4 A4 F4 D4 F4 A4 C5 A4", "か げ を お い こ し て", "影を追い越して"),
                ("E", "B4 G#4 E4 G#4 B4 C5 B4 G#4", "ひ か り を つ か ん で", "光をつかんで"),
                ("E", "E4 G#4 B4 E5 E5 D5 B4 E4", "フ レ ー ズ を は な て", "フレーズを放て"),
            ]),
            derived("break", "間奏", "chorus", take=4),
            derived("outro", "アウトロ", "chorus", take=4, resolve=("Am", "A4")),
        ],
    })

    songs.append({
        "no": 8, "slug": "madobe_no_bluehour", "title": "窓辺のブルーアワー",
        "key": "Eb", "abc_key": "Eb", "key_name": "変ホ長調", "flats": True, "bpm": 72,
        "archetype": "ボカロのバラード。BPM72なら72小節で4分。拍に一音。Aメロとサビを交互に置いて、ブリッジは一度だけ。",
        "form": ["intro", "A", "chorus", "chorus", "A2", "chorus", "bridge", "chorus", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus"),
            section("A", "Aメロ", [
                ("Eb", "Eb4:2 G4:2 Bb4:2 G4:2", "ま ど べ で ね", "窓辺でね"),
                ("Ab", "Ab4:2 Bb4:2 C5:2 Ab4:2", "ゆ う ぐ れ さ", "夕暮れさ"),
                ("Bb", "Bb4:2 Ab4:2 G4:2 F4:2", "き み の こ え", "きみの声"),
                ("Eb", "G4:2 Bb4:2 G4:2 Eb4:2", "と お く へ ね", "遠くへね"),
                ("Cm", "G4:2 Eb4:2 C4:2 Eb4:2", "か ぜ ふ く よ", "風吹くよ"),
                ("Ab", "Ab4:2 C5:2 Bb4:2 Ab4:2", "カ ー テ ン", "カーテン"),
                ("Bb", "Bb4:2 D5:2 C5:2 Bb4:2", "ゆ る く ゆ れ", "ゆるく揺れ"),
                ("Eb", "G4:2 F4:2 Eb4:2 Eb4:2", "ほ し あ か り", "星明かり"),
            ]),
            section("A2", "Aメロ2", [
                ("Eb", "Eb4:2 G4:2 Bb4:2 G4:2", "よ ぎ る よ ね", "よぎるよね"),
                ("Ab", "Ab4:2 Bb4:2 C5:2 Ab4:2", "き の う の ね", "昨日のね"),
                ("Bb", "Bb4:2 Ab4:2 G4:2 F4:2", "え が お が ね", "笑顔がね"),
                ("Eb", "G4:2 Bb4:2 G4:2 Eb4:2", "ま ぶ た に さ", "まぶたにさ"),
                ("Cm", "G4:2 Eb4:2 C4:2 Eb4:2", "と け て く よ", "とけてくよ"),
                ("Ab", "Ab4:2 C5:2 Bb4:2 Ab4:2", "あ お い ろ が", "青色が"),
                ("Bb", "Bb4:2 D5:2 C5:2 Bb4:2", "な ご り を ね", "なごりをね"),
                ("Eb", "G4:2 F4:2 Eb4:2 Eb4:2", "だ い て る よ", "抱いてるよ"),
            ]),
            section("chorus", "サビ", [
                ("Eb", "Bb4:2 G4:2 Bb4:2 Eb5:2", "ぶ る う の ね", "ブルーのね"),
                ("Ab", "C5:2 Bb4:2 Ab4:2 G4:2", "じ か ん に さ", "時間にさ"),
                ("Bb", "Bb4:2 C5:2 D5:2 Bb4:2", "な ま え を ね", "名前をね"),
                ("Eb", "Bb4:2 G4:2 Eb4:2 G4:2", "お い て く よ", "置いてくよ"),
                ("Cm", "G4:2 Bb4:2 C5:2 Eb5:2", "き え な い よ", "消えないよ"),
                ("Ab", "Ab4:2 Bb4:2 C5:2 Bb4:2", "こ の ば しょ で", "この場所で"),
                ("Bb", "Bb4:2 D5:2 Bb4:2 F4:2", "ま た あ う よ", "また会うよ"),
                ("Eb", "G4:2 F4:2 Eb4:2 Eb4:2", "や く そ く さ", "約束さ"),
            ]),
            section("bridge", "ブリッジ", [
                ("Ab", "Ab4:2 C5:2 Eb5:2 C5:2", "も し よ る が", "もし夜が"),
                ("Bb", "D5:2 C5:2 Bb4:2 Ab4:2", "な が く て も", "長くても"),
                ("Eb", "Bb4:2 G4:2 Eb4:2 G4:2", "ひ と り じゃ ね", "ひとりじゃね"),
                ("Cm", "G4:2 Ab4:2 G4:2 Eb4:2", "な い か ら ね", "ないからね"),
                ("Ab", "C5:2 Bb4:2 Ab4:2 G4:2", "ま ど の そ と", "窓の外"),
                ("Bb", "Bb4:2 C5:2 D5:2 Bb4:2", "お な じ よ る", "同じ夜"),
                ("Eb", "G4:2 Bb4:2 C5:2 Bb4:2", "そ ら が あ る", "空がある"),
                ("Bb", "Ab4:2 G4:2 F4:2 Eb4:2", "み え て る よ", "見えてるよ"),
            ]),
            derived("outro", "アウトロ", "chorus", resolve=("Eb", "Eb4")),
        ],
    })

    songs.append({
        "no": 9, "slug": "kasoku_calendar", "title": "加速するカレンダー",
        "key": "Bm", "abc_key": "Bm", "key_name": "ロ短調", "flats": False, "bpm": 180,
        "archetype": "高速ボカロ。BPM180、160小節で3分33秒。Aメロは8分音符の連打、サビは4分音符の掛け声にして聞き取れる速度に戻す。",
        "form": ["intro", "A", "B", "chorus", "chorus", "A2", "B", "chorus", "chorus", "break", "bridge", "chorus", "chorus", "break", "bridge", "chorus", "chorus", "chorus", "outro", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus"),
            section("A", "Aメロ", [
                ("Bm", "B4 D5 D5 B4 F#4 D5 B4 F#4", "ひ づ け を め く る よ", "日付をめくるよ"),
                ("G", "G4 B4 D5 B4 G4 A4 B4 D5", "あ し た が せ ま る よ", "明日が迫るよ"),
                ("D", "F#4 A4 A4 F#4 D4 E4 F#4 A4", "ペ ー ジ が お わ る よ", "ページが終わるよ"),
                ("A", "A4 C#5 E5 C#5 A4 G4 A4 E4", "ば た ば た お ち て く", "ばたばた落ちてく"),
                ("Bm", "D5 B4 F#4 D5 B4 A4 B4 F#4", "じ か ん が は し る よ", "時間が走るよ"),
                ("Em", "E4 G4 B4 G4 E4 F#4 G4 B4", "こ え が ま だ お く れ", "声がまだ遅れ"),
                ("G", "D5 B4 G4 B4 D5 C5 B4 A4", "ま っ て と い っ て も", "待ってと言っても"),
                ("F#", "F#4 A4 C#5 A4 F#4 E4 F#4 F#4", "あ し は と ま ら な い", "足は止まらない"),
            ]),
            section("A2", "Aメロ2", [
                ("Bm", "B4 D5 D5 B4 F#4 D5 B4 F#4", "か ぞ え き れ な い よ", "数えきれないよ"),
                ("G", "G4 B4 D5 B4 G4 A4 B4 D5", "つ き ひ が と ん で く", "月日が飛んでく"),
                ("D", "F#4 A4 A4 F#4 D4 E4 F#4 A4", "よ は く が へ っ て く", "余白が減ってく"),
                ("A", "A4 C#5 E5 C#5 A4 G4 A4 E4", "ま だ か き た い の に", "まだ書きたいのに"),
                ("Bm", "D5 B4 F#4 D5 B4 A4 B4 F#4", "な ま え だ け お く よ", "名前だけ置くよ"),
                ("Em", "E4 G4 B4 G4 E4 F#4 G4 B4", "ペ ー ジ を に ぎ っ て", "ページを握って"),
                ("G", "D5 B4 G4 B4 D5 C5 B4 A4", "は や く な る ほ ど に", "速くなるほどに"),
                ("F#", "F#4 A4 C#5 A4 F#4 E4 F#4 F#4", "う た は ま け な い よ", "歌は負けないよ"),
            ]),
            section("B", "Bメロ", [
                ("G", "B4 D5 D5 B4 G4 A4 B4 G4", "びょ う が す ぎ て く よ", "秒が過ぎてくよ"),
                ("D", "F#4 A4 C#5 A4 F#4 E4 F#4 A4", "ま ば た き す る ま に", "まばたきするまに"),
                ("A", "A4 C#5 E5 C#5 A4 B4 C#5 A4", "きょ う の よ て い が ね", "今日の予定がね"),
                ("Bm", "B4 D5 F#5 D5 B4 A4 B4 F#4", "あ し た に か わ る よ", "明日に変わるよ"),
                ("Em", "E4 G4 B4 G4 E4 D4 E4 G4", "お い か け て も い い", "追いかけてもいい"),
                ("G", "D5 B4 G4 B4 D5 C5 B4 G4", "に げ て く ひ に も ね", "逃げてく日にもね"),
                ("D", "A4 F#4 D5 A4 F#4 E4 F#4 D4", "う た だ け お い つ く", "歌だけ追いつく"),
                ("F#", "F#4 A4 C#5 F#5 F#5 E5 C#5 A4", "か く ご は で き て る", "覚悟はできてる"),
            ]),
            section("chorus", "サビ", [
                ("Bm", "B4:2 D5:2 F#5:2 D5:2", "か そ く だ よ", "加速だよ"),
                ("G", "G4:2 B4:2 D5:2 B4:2", "ひ め く り さ", "日めくりさ"),
                ("D", "A4:2 F#4:2 D4:2 F#4:2", "と ま ら ず に", "止まらずに"),
                ("A", "E5:2 C#5:2 A4:2 C#5:2", "ま わ る よ ね", "回るよね"),
                ("Bm", "D5:2 B4:2 F#4:2 B4:2", "む ね の お と", "胸の音"),
                ("Em", "G4:2 B4:2 E5:2 B4:2", "お い つ く よ", "追いつくよ"),
                ("G", "D5:2 B4:2 G4:2 B4:2", "こ よ み を ね", "暦をね"),
                ("F#", "F#4:2 A4:2 C#5:2 F#4:2", "め く る の さ", "めくるのさ"),
            ]),
            section("bridge", "ブリッジ", [
                ("Bm", "B4:2 D5:2 B4:2 F#4:2", "す こ し だ け", "少しだけ"),
                ("G", "G4:2 B4:2 D5:2 B4:2", "そ こ に い て", "そこにいて"),
                ("D", "A4:2 F#4:2 D4:2 A4:2", "ペ ー ジ を ね", "ページをね"),
                ("A", "C#5:2 A4:2 E4:2 A4:2", "お さ え て よ", "押さえてよ"),
                ("Bm", "D5:2 B4:2 F#4:2 D5:2", "な ま え を ね", "名前をね"),
                ("Em", "E4:2 G4:2 B4:2 G4:2", "よ む か ら ね", "読むからね"),
                ("G", "B4:2 D5:2 B4:2 G4:2", "じ か ん よ ね", "時間よね"),
                ("F#", "A#4:2 F#4:2 C#5:2 A#4:2", "と ま っ て よ", "止まってよ"),
            ]),
            derived("break", "間奏", "chorus"),
            derived("outro", "アウトロ", "chorus", resolve=("Bm", "B4")),
        ],
    })

    songs.append({
        "no": 10, "slug": "bokura_no_anthem", "title": "僕らのアンセム",
        "key": "E", "abc_key": "E", "key_name": "ホ長調", "flats": False, "bpm": 160,
        "archetype": "サビの厚いアニソンのフルサイズ。BPM160、160小節で4分。二番のあとブリッジを二度置き、ラストはサビを三回重ねる。",
        "form": ["intro", "A", "B", "chorus", "chorus", "A2", "B", "chorus", "chorus", "break", "bridge", "chorus", "chorus", "break", "bridge", "chorus", "chorus", "chorus", "outro", "outro"],
        "sections": [
            derived("intro", "イントロ", "chorus"),
            section("A", "Aメロ", [
                ("E", "E4 E4 G#4 A4 B4 A4 G#4 E4", "あ さ の し ず け さ に", "朝の静けさに"),
                ("B", "F#4 G#4 F#4 D#4 F#4 E4 D#4 B4", "ゆ び わ を か ぞ え た", "指輪を数えた"),
                ("C#m", "G#4 B4 C#5 B4 G#4 A4 G#4 E4", "ち い さ な や く そ く", "小さな約束"),
                ("A", "A4 C#5 B4 A4 E4 A4 C#5 A4", "む ね の そ こ に あ る", "胸のそこにある"),
                ("E", "E4 G#4 B4 G#4 E4 F#4 G#4 A4", "く つ が へ る ほ ど に", "靴が減るほどに"),
                ("F#m", "F#4 A4 C#5 A4 F#4 E4 D#4 E4", "ま ち が ひ ろ が っ て", "街が広がって"),
                ("A", "A4 B4 C#5 E5 C#5 B4 A4 E4", "み え な い ば しょ か ら", "見えない場所から"),
                ("B", "B4 A4 G#4 F#4 D#4 F#4 G#4 B4", "う た が き こ え る よ", "歌が聞こえるよ"),
            ]),
            section("A2", "Aメロ2", [
                ("E", "E4 E4 G#4 A4 B4 A4 G#4 E4", "ひ る の ざ わ め き に", "昼のざわめきに"),
                ("B", "F#4 G#4 F#4 D#4 F#4 E4 D#4 B4", "な ま え を な く し た", "名前をなくした"),
                ("C#m", "G#4 B4 C#5 B4 G#4 A4 G#4 E4", "こ え の お く が わ で", "声の奥側で"),
                ("A", "A4 C#5 B4 A4 E4 A4 C#5 A4", "き み が わ ら っ て た", "きみが笑ってた"),
                ("E", "E4 G#4 B4 G#4 E4 F#4 G#4 A4", "ゆ う ぐ れ の か ど で", "夕暮れの角で"),
                ("F#m", "F#4 A4 C#5 A4 F#4 E4 D#4 E4", "て を ふ っ て み た よ", "手を振ってみたよ"),
                ("A", "A4 B4 C#5 E5 C#5 B4 A4 E4", "そ の こ え が ひ び く", "その声が響く"),
                ("B", "B4 A4 G#4 F#4 D#4 F#4 G#4 B4", "こ こ ろ の ド ラ ム だ", "心のドラムだ"),
            ]),
            section("B", "Bメロ", [
                ("A", "A4 C#5 E5 C#5 A4 B4 C#5 A4", "お お き な こ え で は", "大きな声では"),
                ("E", "G#4 B4 E5 B4 G#4 F#4 E4 G#4", "そ れ で も い い ん だ", "それでもいいんだ"),
                ("B", "F#4 A4 B4 A4 F#4 E4 F#4 A4", "ず れ た リ ズ ム も ね", "ずれたリズムもね"),
                ("E", "G#4 G#4 A4 B4 G#4 F#4 E4 E4", "そ ろ っ て く か ら ね", "そろってくからね"),
                ("C#m", "C#5 E5 B4 G#4 C#5 B4 A4 G#4", "か み な り の よ う に", "雷のように"),
                ("A", "A4 C#5 E5 A4 C#5 B4 A4 E4", "ち い さ な は く しゅ が", "小さな拍手が"),
                ("F#m", "F#4 A4 C#5 F#5 C#5 A4 F#4 E4", "ま ち に ひ ろ が っ て", "街に広がって"),
                ("B", "B4 D#5 F#5 D#5 B4 A4 G#4 F#4", "う た に か わ る よ ね", "歌に変わるよね"),
            ]),
            section("chorus", "サビ", [
                ("E", "E4 G#4 B4 E5 B4 G#4 E4 B4", "ぼ く ら の ア ン セ ム", "僕らのアンセム"),
                ("B", "B4 B4 A4 G#4 F#4 G#4 A4 B4", "こ え を か さ ね る よ", "声を重ねるよ"),
                ("C#m", "C#5 C#5 B4 A4 G#4 A4 B4 C#5", "ひ と り じゃ な い か ら", "ひとりじゃないから"),
                ("A", "A4 C#5 E5 C#5 A4 G#4 A4 E4", "み ち が ひ ら け る よ", "道がひらけるよ"),
                ("E", "E5 D#5 B4 G#4 B4 E5 E5 B4", "な み だ の さ き の ひ", "涙の先の日"),
                ("F#m", "F#4 A4 C#5 A4 F#4 E4 F#4 A4", "な ま え を よ ぶ か ら", "名前を呼ぶから"),
                ("A", "A4 B4 C#5 E5 C#5 B4 A4 G#4", "あ し た へ つ な ご う", "明日へつなごう"),
                ("B", "B4 G#4 F#4 D#4 D#4 F#4 G#4 B4", "こ こ か ら う た お う", "ここから歌おう"),
            ]),
            section("bridge", "ブリッジ", [
                ("C#m", "E4 G#4 B4 G#4 E4 F#4 G#4 B4", "お ぼ え て る か な あ", "覚えてるかなあ"),
                ("A", "A4 C#5 E5 C#5 A4 G#4 A4 C#5", "は じ め の ひ と こ え", "はじめの一声"),
                ("E", "B4 G#4 E4 G#4 B4 C#5 B4 G#4", "ふ る え て た の に ね", "ふるえてたのにね"),
                ("B", "F#4 A4 B4 F#4 D#4 E4 F#4 B4", "い ま は か さ な る よ", "今は重なるよ"),
                ("A", "A4 B4 C#5 E5 C#5 A4 B4 C#5", "だ れ か の う た が ね", "だれかの歌がね"),
                ("F#m", "F#4 A4 C#5 A4 F#4 E4 F#4 A4", "だ れ か を よ ぶ よ う", "だれかを呼ぶよう"),
                ("E", "G#4 B4 E5 B4 G#4 A4 B4 G#4", "ぼ く ら も ま じ っ て", "僕らも混じって"),
                ("B", "B4 A4 G#4 F#4 D#4 F#4 G#4 B4", "う た い つ づ け よ う", "歌い続けよう"),
            ]),
            derived("break", "間奏", "chorus"),
            derived("outro", "アウトロ", "chorus", resolve=("E", "E4")),
        ],
    })
    from vocaloid_more import extra_songs
    songs.extend(extra_songs())
    return songs


def main():
    views = []
    all_warns = []
    catalog = build_catalog()
    if ERRORS:
        (ROOT / "errors.txt").write_text("\n".join(ERRORS), encoding="utf-8")
        raise SystemExit(f"lyric errors: {len(ERRORS)} -> errors.txt")
    for song in catalog:
        try:
            view = song_files(song)
        except ValueError as e:
            raise SystemExit(f'{song["title"]}: {e}') from e
        views.append(view)
        all_warns.extend(view["warns"])
        print(f'{view["no"]:02d} {view["title"]}  {view["bars"]}小節  {view["length"]}  {view["seconds"]:.1f}s')
    html_text = render_html(views)
    (ROOT / "index.html").write_text(html_text, encoding="utf-8")
    print(f'wrote {ROOT / "index.html"}')
    if all_warns:
        print(f"強拍の注意 {len(all_warns)}")
        for w in all_warns:
            print(" -", w)


if __name__ == "__main__":
    main()
