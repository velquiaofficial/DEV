# -*- coding: utf-8 -*-
"""ボカロ向けオリジナル20曲。テンポを72〜192に散らす。"""

from build_songbook import (
    chord_midis,
    chord_pcs,
    derived,
    midi_name,
    pitch_midi,
    section,
)

MOD = set("ゃゅょぁぃぅぇぉャュョァィゥェォ")

SCALES = {
    "C": ["C", "D", "E", "F", "G", "A", "B"],
    "G": ["G", "A", "B", "C", "D", "E", "F#"],
    "D": ["D", "E", "F#", "G", "A", "B", "C#"],
    "A": ["A", "B", "C#", "D", "E", "F#", "G#"],
    "E": ["E", "F#", "G#", "A", "B", "C#", "D#"],
    "F": ["F", "G", "A", "Bb", "C", "D", "E"],
    "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
    "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    "Am": ["A", "B", "C", "D", "E", "F", "G"],
    "Em": ["E", "F#", "G", "A", "B", "C", "D"],
    "Bm": ["B", "C#", "D", "E", "F#", "G", "A"],
    "Dm": ["D", "E", "F", "G", "A", "Bb", "C"],
}
KEY_NAME = {
    "C": "ハ長調", "G": "ト長調", "D": "ニ長調", "A": "イ長調", "E": "ホ長調",
    "F": "ヘ長調", "Bb": "変ロ長調", "Eb": "変ホ長調",
    "Am": "イ短調", "Em": "ホ短調", "Bm": "ロ短調", "Dm": "ニ短調",
}
ROOT = {
    "C": "C4", "G": "G4", "D": "D4", "A": "A4", "E": "E4",
    "F": "F4", "Bb": "Bb4", "Eb": "Eb4",
    "Am": "A4", "Em": "E4", "Bm": "B4", "Dm": "D4",
}
FLATS = {"F", "Bb", "Eb", "Dm"}
RHYTHM = {
    "8": [1, 1, 1, 1, 1, 1, 1, 1],
    "4": [2, 2, 2, 2],
    "6": [1, 1, 1, 1, 2, 2],
    "off": [1, 1, 2, 1, 1, 1],
    "bounce": [1, 1, 2, 1, 1, 2],
}
SHAPE = {
    8: [0, 1, 2, 1, 0, -1, 1, 0],
    6: [0, 2, 1, 0, -1, 1],
    4: [0, 2, 1, -1],
}
CONTOUR = {
    "A": [0, 1, 2, 0, -1, 1, 2, -1],
    "A2": [0, 1, 2, 0, -1, 1, 2, -1],
    "B": [2, 3, 1, 4, 2, 0, 3, 1],
    "chorus": [4, 2, 5, 3, 6, 2, 4, 0],
    "bridge": [-1, 2, 0, 3, -2, 1, 2, -1],
}


def morae(text: str) -> list[str]:
    out = []
    for ch in text:
        if ch in MOD and out:
            out[-1] += ch
        else:
            out.append(ch)
    return out


def L(reading: str, show: str, n: int):
    parts = morae(reading)
    if len(parts) != n:
        raise ValueError(f"{len(parts)}!={n} {reading} / {' '.join(parts)}")
    return (" ".join(parts), show)


def prog_major(I, IV, V, vi, ii):
    return {
        "A": [I, vi, IV, V, I, IV, vi, V],
        "A2": [I, vi, IV, V, I, IV, vi, V],
        "B": [IV, I, vi, V, ii, IV, V, V],
        "chorus": [I, V, vi, IV, I, vi, IV, V],
        "bridge": [vi, IV, I, V, ii, vi, IV, V],
    }


def prog_minor(i, VI, III, VII, iv, V):
    return {
        "A": [i, VI, III, VII, i, iv, VI, V],
        "A2": [i, VI, III, VII, i, iv, VI, V],
        "B": [VI, III, VII, i, iv, VI, III, V],
        "chorus": [i, VI, III, VII, i, iv, VI, V],
        "bridge": [iv, VI, III, V, i, iv, VII, V],
    }


PROGS = {
    "C": prog_major("C", "F", "G", "Am", "Dm"),
    "G": prog_major("G", "C", "D", "Em", "Am"),
    "D": prog_major("D", "G", "A", "Bm", "Em"),
    "A": prog_major("A", "D", "E", "F#m", "Bm"),
    "E": prog_major("E", "A", "B", "C#m", "F#m"),
    "F": prog_major("F", "Bb", "C", "Dm", "Gm"),
    "Bb": prog_major("Bb", "Eb", "F", "Gm", "Cm"),
    "Eb": prog_major("Eb", "Ab", "Bb", "Cm", "Fm"),
    "Am": prog_minor("Am", "F", "C", "G", "Dm", "E"),
    "Em": prog_minor("Em", "C", "G", "D", "Am", "B7"),
    "Bm": prog_minor("Bm", "G", "D", "A", "Em", "F#"),
    "Dm": prog_minor("Dm", "Bb", "F", "C", "Gm", "A"),
}


def scale_midis(key: str, lo=57, hi=84):
    found = []
    for octv in range(3, 7):
        for name in SCALES[key]:
            m = pitch_midi(f"{name}{octv}")
            if lo <= m <= hi:
                found.append(m)
    return found


def chord_options(symbol: str, lo=57, hi=84):
    opts = []
    for octv in (3, 4, 5, 6):
        for m in chord_midis(symbol, octv):
            if lo <= m <= hi:
                opts.append(m)
    return opts


def choose(target: int, pool: list[int], prev: int | None):
    if not pool:
        raise ValueError("音の候補がありません")
    ranked = sorted(pool, key=lambda m: (abs(m - target), 0 if prev is None or m != prev else 1, m))
    return ranked[0]


ROLE_BASE = {"A3": "A", "B2": "B", "chorus2": "chorus", "bridge2": "bridge", "C": "B"}
LABELS = {
    "A": "Aメロ", "A2": "Aメロ2", "A3": "Aメロ3",
    "B": "Bメロ", "B2": "Bメロ2",
    "chorus": "サビ", "chorus2": "サビ2",
    "bridge": "ブリッジ", "bridge2": "ブリッジ2",
    "C": "Cメロ",
}


def compose_rows(key: str, chords: list[str], lyrics: list, rhythm: str, role: str, salt: int):
    durs = RHYTHM[rhythm]
    leading_rest = rhythm == "off"
    flats = key in FLATS
    scale = scale_midis(key)
    shape = SHAPE[len(durs)]
    base = ROLE_BASE.get(role, role)
    bias = CONTOUR[base]
    center = 67 if base in ("A", "bridge") else 70 if base == "B" else 73
    prev = pitch_midi(ROOT[key]) + (salt % 5) - 2
    rows = []
    for i, (chord, (spaced, show)) in enumerate(zip(chords, lyrics)):
        strong_pool = chord_options(chord)
        step_pool = [m for m in scale if 57 <= m <= 84] or strong_pool
        pos = 1 if leading_rest else 0
        pitches = []
        for j, dur in enumerate(durs):
            target = center + bias[(i + salt) % 8] + shape[j]
            covers = any(pos <= b < pos + dur for b in (0, 4))
            pool = strong_pool if covers else step_pool
            picked = choose(target, pool, prev)
            pitches.append(midi_name(picked, flats))
            prev = picked
            pos += dur
        bits = []
        if leading_rest:
            bits.append("r")
        for p, dur in zip(pitches, durs):
            bits.append(p if dur == 1 else f"{p}:{dur}")
        rows.append((chord, " ".join(bits), spaced, show))
    return rows


def make_form(units: int):
    seq = ["intro", "A", "B", "chorus", "A2", "chorus", "bridge", "chorus", "outro"]
    extras = ["chorus", "break", "chorus", "B", "chorus", "break", "chorus", "chorus", "chorus", "chorus", "chorus"]
    need = units - len(seq)
    if need < 0:
        raise ValueError(f"小節が足りません {units}")
    return seq[:-1] + extras[:need] + ["outro"]


def make_form_dense(units: int):
    seq = [
        "intro", "A", "A2", "B", "chorus",
        "A3", "B2", "chorus2", "bridge", "C",
        "chorus", "bridge2", "outro",
    ]
    extras = ["break", "chorus2", "C", "chorus", "break", "A3", "chorus"]
    need = units - len(seq)
    if need < 0 or need > len(extras):
        raise ValueError(f"小節数が合いません {units}")
    return seq[:-1] + extras[:need] + ["outro"]


def build_song(spec: dict):
    key = spec["key"]
    lyrics = spec["lyrics"]
    rhythm = spec["rhythm"]
    chorus_rhythm = spec.get("chorus_rhythm", rhythm)
    salt = spec["no"]
    dense = spec.get("dense", False)
    roles = ("A", "A2", "A3", "B", "B2", "chorus", "chorus2", "bridge", "bridge2", "C") if dense else ("A", "A2", "B", "chorus", "bridge")
    sections = []
    for role in roles:
        label = LABELS[role]
        rhy = chorus_rhythm if role in ("chorus", "chorus2") else rhythm
        n = len(RHYTHM[rhy])
        lines = [L(a, b, n) for a, b in lyrics[role]]
        if len(lines) != 8:
            raise ValueError(f"{spec['title']} {role} は8行必要")
        rows = compose_rows(key, PROGS[key][ROLE_BASE.get(role, role)], lines, rhy, role, salt)
        sections.append(section(role, label, rows))
    sections.append(derived("intro", "イントロ", "chorus"))
    sections.append(derived("break", "間奏", "chorus"))
    sections.append(derived("outro", "アウトロ", "chorus", resolve=(key if key in ROOT else key, ROOT[key])))
    # 短調の主和音はコード名そのもの（Am など）。resolve のコードは三和音名。
    tonic_chord = {"Am": "Am", "Em": "Em", "Bm": "Bm", "Dm": "Dm"}.get(key, key)
    sections[-1] = derived("outro", "アウトロ", "chorus", resolve=(tonic_chord, ROOT[key]))
    units = spec["bars"] // 8
    if spec["bars"] % 8:
        raise ValueError(spec["title"])
    seconds = spec["bars"] * 4 * 60 / spec["bpm"]
    m, s = divmod(int(round(seconds)), 60)
    if dense:
        archetype = f"歌詞が多い版。BPM{spec['bpm']}、{spec['bars']}小節で{m}:{s:02d}。1小節に8モーラを置き、Aメロ3、サビ2、Cメロまで行を変える。{spec['feel']}"
        form = make_form_dense(units)
    else:
        archetype = f"ボカロ向け。BPM{spec['bpm']}、{spec['bars']}小節で{m}:{s:02d}。{spec['feel']}"
        form = make_form(units)
    return {
        "no": spec["no"],
        "slug": spec["slug"],
        "title": spec["title"],
        "key": key,
        "abc_key": key,
        "key_name": KEY_NAME[key],
        "flats": key in FLATS,
        "bpm": spec["bpm"],
        "archetype": archetype,
        "form": form,
        "sections": sections,
    }


def extra_songs():
    from vocaloid_rest import REST
    from vocaloid_dense import DENSE
    songs = []
    for spec in SPECS + REST + DENSE:
        songs.append(build_song(spec))
    return songs


# 読みはモーラ数がリズムと一致するものだけ。
SPECS = [
    {
        "no": 11, "slug": "error_code_no_yoru", "title": "エラーコードの夜",
        "key": "Bm", "bpm": 184, "bars": 152, "rhythm": "8", "chorus_rhythm": "4",
        "feel": "高速。Aメロは8分の連打、サビは4分音符の掛け声。",
        "lyrics": {
            "A": [
                ("エラーをかぞえる", "エラーを数える"),
                ("よるぞらでみるよ", "夜空で見るよ"),
                ("ほしがひとつへる", "星がひとつ減る"),
                ("それでもうたうよ", "それでも歌うよ"),
                ("まばたきのかずに", "まばたきの数に"),
                ("ひづけがかわって", "日付が変わって"),
                ("こえはまだのこる", "声はまだ残る"),
                ("バグはきえないよ", "バグは消えないよ"),
            ],
            "A2": [
                ("ログをおいこして", "ログを追い越して"),
                ("あしたがせまるよ", "明日が迫るよ"),
                ("ページがまぶしい", "ページがまぶしい"),
                ("それでもめくるよ", "それでもめくるよ"),
                ("なまえをいちぎょう", "名前を一行"),
                ("のこしておきたい", "残しておきたい"),
                ("うただけがそのば", "歌だけがその場"),
                ("しょうめいにするよ", "証明にするよ"),
            ],
            "B": [
                ("びょうがすぎてくよ", "秒が過ぎてくよ"),
                ("こころがおいつく", "心が追いつく"),
                ("すうじがおどって", "数字が踊って"),
                ("よるをてらしてる", "夜を照らしてる"),
                ("まちがってもいい", "間違ってもいい"),
                ("けせばいいだけさ", "消せばいいだけさ"),
                ("ひかりをつかんで", "光をつかんで"),
                ("うたはとまらない", "歌は止まらない"),
            ],
            "bridge": [
                ("すこしだけまって", "少しだけ待って"),
                ("ページをおさえて", "ページを押さえて"),
                ("なまえをよぶから", "名前を呼ぶから"),
                ("じかんよとまって", "時間よ止まって"),
                ("エラーのこころも", "エラーの心も"),
                ("うたえばなおるよ", "歌えば直るよ"),
                ("よるのしょうめいだ", "夜の証明だ"),
                ("こえはまだのこる", "声はまだ残る"),
            ],
            "chorus": [
                ("よぞらの", "夜空の"),
                ("バグだよ", "バグだよ"),
                ("かぞえて", "数えて"),
                ("うたうよ", "歌うよ"),
                ("おわらず", "終わらず"),
                ("こえがね", "声がね"),
                ("ひかるよ", "光るよ"),
                ("よるそら", "夜空"),
            ],
        },
    },
    {
        "no": 12, "slug": "neon_zankyou", "title": "ネオン残響",
        "key": "Dm", "bpm": 128, "bars": 112, "rhythm": "off",
        "feel": "エレクトロ。小節の頭を休符にして、言葉は裏から入る。",
        "lyrics": {
            "A": [
                ("まちのねいろ", "街の音色"),
                ("きょうめいする", "共鳴する"),
                ("くちびるから", "唇から"),
                ("こえがもれる", "声が漏れる"),
                ("ガラスごしに", "ガラス越しに"),
                ("ひかりがふる", "光が降る"),
                ("いきをすって", "息を吸って"),
                ("うたにかえる", "歌に変える"),
            ],
            "A2": [
                ("ねおんがゆれ", "ネオンが揺れ"),
                ("かげがふたつ", "影がふたつ"),
                ("なまえうつる", "名前映る"),
                ("びるにうつる", "ビルに映る"),
                ("ざんきょうだよ", "残響だよ"),
                ("みみにのこる", "耳に残る"),
                ("もういちどね", "もう一度ね"),
                ("うたをだそう", "歌を出そう"),
            ],
            "B": [
                ("あしぶみして", "足踏みして"),
                ("しんごうまち", "信号待ち"),
                ("あおになるよ", "青になるよ"),
                ("むねがはやる", "胸が逸る"),
                ("かぞえてくよ", "数えてくよ"),
                ("ひかりのほう", "光のほう"),
                ("てをふってく", "手を振ってく"),
                ("うたいだすよ", "歌い出すよ"),
            ],
            "bridge": [
                ("もしもこえが", "もしも声が"),
                ("とぎれてもね", "途切れてもね"),
                ("ねおんのした", "ネオンの下"),
                ("うたはのこる", "歌は残る"),
                ("ざんきょうだけ", "残響だけ"),
                ("きみにとどく", "きみに届く"),
                ("よるをこえて", "夜を越えて"),
                ("もういちどね", "もう一度ね"),
            ],
            "chorus": [
                ("こえをのせて", "声を乗せて"),
                ("まちのこどう", "街の鼓動"),
                ("ここにいるよ", "ここにいるよ"),
                ("いきをすうよ", "息を吸うよ"),
                ("こわれてもね", "壊れてもね"),
                ("うたはのこる", "歌は残る"),
                ("よるをこえて", "夜を越えて"),
                ("うたいだそう", "歌い出そう"),
            ],
        },
    },
    {
        "no": 13, "slug": "zaiko_no_hikari", "title": "在庫のひかり",
        "key": "Eb", "bpm": 72, "bars": 72, "rhythm": "4",
        "feel": "バラード。拍に一音。光が在庫切れになる前に名前を置く。",
        "lyrics": {
            "A": [
                ("まどべで", "窓辺で"),
                ("すわって", "座って"),
                ("よるのひ", "夜の灯"),
                ("みてるよ", "見てるよ"),
                ("なまえを", "名前を"),
                ("こころに", "心に"),
                ("のこすよ", "残すよ"),
                ("しずかに", "静かに"),
            ],
            "A2": [
                ("ゆうぐれ", "夕暮れ"),
                ("ひかって", "光って"),
                ("へやのね", "部屋の音"),
                ("とおのく", "遠のく"),
                ("そのこえ", "その声"),
                ("まぶたに", "まぶたに"),
                ("のこって", "残って"),
                ("あたたか", "あたたか"),
            ],
            "B": [
                ("ざいこが", "在庫が"),
                ("すくない", "少ない"),
                ("ひかりを", "光を"),
                ("わけあう", "分け合う"),
                ("ひとりじゃ", "ひとりじゃ"),
                ("たりない", "足りない"),
                ("うたえば", "歌えば"),
                ("ふえるよ", "増えるよ"),
            ],
            "bridge": [
                ("もしよる", "もし夜"),
                ("ながくて", "長くて"),
                ("こえだけ", "声だけ"),
                ("ともそう", "灯そう"),
                ("なまえは", "名前は"),
                ("きえない", "消えない"),
                ("このひを", "この灯を"),
                ("わすれず", "忘れず"),
            ],
            "chorus": [
                ("ひかりの", "光の"),
                ("ざいこだ", "在庫だ"),
                ("まだきみ", "まだきみ"),
                ("てにとれ", "手にとれ"),
                ("きえそう", "消えそう"),
                ("でもまだ", "でもまだ"),
                ("うたえば", "歌えば"),
                ("のこるよ", "残るよ"),
            ],
        },
    },
    {
        "no": 14, "slug": "skip_keihou", "title": "スキップ警報",
        "key": "Bb", "bpm": 152, "bars": 128, "rhythm": "bounce",
        "feel": "かわいい系。短長の跳ねる刻み。警報なのに足取りはスキップ。",
        "lyrics": {
            "A": [
                ("あまいでんぱ", "甘い電波"),
                ("そらへでるよ", "空へ出るよ"),
                ("ポケットふる", "ポケットふる"),
                ("あまいかおり", "甘い香り"),
                ("けいほうがね", "警報がね"),
                ("ほしにきこえ", "星に聞こえ"),
                ("なまえをよぶ", "名前を呼ぶ"),
                ("きみのことを", "きみのことを"),
            ],
            "A2": [
                ("ぴんくのくも", "ピンクの雲"),
                ("くもにのせて", "雲に乗せて"),
                ("だんをのぼる", "段をのぼる"),
                ("ひかりのほう", "光のほう"),
                ("てをふるから", "手を振るから"),
                ("よくみえるよ", "よく見えるよ"),
                ("シグナルだよ", "シグナルだよ"),
                ("もういちどね", "もう一度ね"),
            ],
            "B": [
                ("ほしをかぞえ", "星を数え"),
                ("ひとつずつね", "ひとつずつね"),
                ("あまさきっぽ", "甘さきっぽ"),
                ("そこまでゆく", "そこまでゆく"),
                ("ゼロじからだ", "ゼロ時からだ"),
                ("よるがくるよ", "夜がくるよ"),
                ("じゅんびおっけ", "準備おっけ"),
                ("うたいだそう", "歌い出そう"),
            ],
            "bridge": [
                ("もしでんぱが", "もし電波が"),
                ("とぎれてもね", "途切れてもね"),
                ("あまいうたは", "甘い歌は"),
                ("のこってるよ", "残ってるよ"),
                ("けいほうやむ", "警報やむ"),
                ("スキップだよ", "スキップだよ"),
                ("きみをみてね", "きみを見てね"),
                ("うたうからね", "歌うからね"),
            ],
            "chorus": [
                ("スキップだね", "スキップだね"),
                ("けいほうだよ", "警報だよ"),
                ("あまいおとよ", "甘い音よ"),
                ("こわくないよ", "こわくないよ"),
                ("ほしにふれる", "星にふれる"),
                ("てをふってく", "手を振ってく"),
                ("いっしょにとぶ", "いっしょに飛ぶ"),
                ("とびだそうよ", "飛び出そうよ"),
            ],
        },
    },
]
