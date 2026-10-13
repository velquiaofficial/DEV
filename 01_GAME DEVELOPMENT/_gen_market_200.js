"use strict";
/**
 * 200_MARKET_GAMES — ~100 demand-genre playable games (standalone folders).
 * Relixia untouched. Ports 5301+.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "200_MARKET_GAMES");
const ENGINE_SRC = path.join(__dirname, "_market_engine.js");
const SERVER_SRC = path.join(__dirname, "14_BOARDGAME", "01_ISLEBOUND", "vq-server.js");

const THEMES = {
  dusk: { bg: "#0d1b2a", bg2: "#1b263b", panel: "rgba(13,27,42,.92)", ink: "#e0eefc", muted: "#8ea9c1", accent: "#4cc9f0", accent2: "#f72585", line: "rgba(76,201,240,.25)", glow: "rgba(76,201,240,.16)", glow2: "rgba(247,37,133,.12)", board: "#0b1320" },
  orchard: { bg: "#1b4332", bg2: "#081c15", panel: "rgba(27,67,50,.92)", ink: "#e8fff3", muted: "#95d5b2", accent: "#95d5b2", accent2: "#f4a261", line: "rgba(149,213,178,.25)", glow: "rgba(149,213,178,.18)", glow2: "rgba(244,162,97,.12)", board: "#2d6a4f" },
  candy: { bg: "#3a0ca3", bg2: "#7209b7", panel: "rgba(58,12,163,.9)", ink: "#fff0f6", muted: "#f8b4d9", accent: "#f72585", accent2: "#4cc9f0", line: "rgba(247,37,133,.3)", glow: "rgba(247,37,133,.2)", glow2: "rgba(76,201,240,.12)", board: "#240046" },
  ink: { bg: "#111", bg2: "#222", panel: "rgba(20,20,20,.92)", ink: "#f1f3f5", muted: "#adb5bd", accent: "#ffd166", accent2: "#06d6a0", line: "rgba(255,209,102,.25)", glow: "rgba(255,209,102,.14)", glow2: "rgba(6,214,160,.1)", board: "#1a1a1a" },
  paper: { bg: "#f1faee", bg2: "#e9edc9", panel: "rgba(255,255,255,.9)", ink: "#1d3557", muted: "#457b9d", accent: "#e63946", accent2: "#1d3557", line: "rgba(29,53,87,.15)", glow: "rgba(230,57,70,.12)", glow2: "rgba(69,123,157,.1)", board: "#f8f9fa" },
  magma: { bg: "#1a0a0a", bg2: "#3d0c02", panel: "rgba(40,10,10,.92)", ink: "#ffe5d9", muted: "#f4a261", accent: "#e76f51", accent2: "#ffd166", line: "rgba(231,111,81,.3)", glow: "rgba(231,111,81,.18)", glow2: "rgba(255,209,102,.1)", board: "#1b100a" },
  ice: { bg: "#023e8a", bg2: "#0077b6", panel: "rgba(2,62,138,.9)", ink: "#caf0f8", muted: "#90e0ef", accent: "#00b4d8", accent2: "#ffd166", line: "rgba(144,224,239,.3)", glow: "rgba(0,180,216,.2)", glow2: "rgba(255,209,102,.1)", board: "#03045e" },
  meadow: { bg: "#606c38", bg2: "#283618", panel: "rgba(40,54,24,.92)", ink: "#fefae0", muted: "#dda15e", accent: "#bc6c25", accent2: "#fefae0", line: "rgba(221,161,94,.3)", glow: "rgba(188,108,37,.16)", glow2: "rgba(254,250,224,.08)", board: "#283618" },
  neon: { bg: "#10002b", bg2: "#240046", panel: "rgba(16,0,43,.92)", ink: "#e0aaff", muted: "#c77dff", accent: "#7b2cbf", accent2: "#ff6d00", line: "rgba(199,125,255,.3)", glow: "rgba(123,44,191,.2)", glow2: "rgba(255,109,0,.12)", board: "#0a0014" },
  sand: { bg: "#582f0e", bg2: "#7f4f24", panel: "rgba(88,47,14,.92)", ink: "#faedcd", muted: "#d4a373", accent: "#ccd5ae", accent2: "#e9c46a", line: "rgba(204,213,174,.25)", glow: "rgba(233,196,106,.16)", glow2: "rgba(212,163,115,.12)", board: "#3a1f0a" }
};

/** 10 kinds × 10 titles = 100 */
const CATALOG = [
  // merge
  ["01_TILEFOLD", "TILEFOLD", "merge", "dusk", "数字タイル合成", "矢印でスワイプして同じ数を合成。ゴール数字を作れ。", { size: 4, goal: 2048 }],
  ["02_HEXMERGE", "HEXMERGE", "merge", "candy", "ネオン合成パズル", "4×4で高得点タイルを目指せ。", { size: 4, goal: 1024 }],
  ["03_GEMSTACK", "GEMSTACK", "merge", "ice", "宝石合成", "冷たい盤面で合成を極めろ。", { size: 4, goal: 2048 }],
  ["04_RUNEJOIN", "RUNEJOIN", "merge", "neon", "ルーン合成", "魔法数字を繋げ。", { size: 4, goal: 2048 }],
  ["05_COINPRESS", "COINPRESS", "merge", "sand", "コイン圧着", "価値を倍々に。", { size: 4, goal: 1024 }],
  ["06_BLOCKFUSE", "BLOCKFUSE", "merge", "magma", "ブロック融合", "溶岩テーマの2048系。", { size: 4, goal: 2048 }],
  ["07_LEAFADD", "LEAFADD", "merge", "orchard", "リーフ加算", "自然テーマの合成。", { size: 4, goal: 1024 }],
  ["08_INKDOUBLE", "INKDOUBLE", "merge", "ink", "インク倍化", "モノクロで集中。", { size: 4, goal: 2048 }],
  ["09_PAPER2048", "PAPER2048", "merge", "paper", "紙の2048", "明るく見やすい盤。", { size: 4, goal: 2048 }],
  ["10_MEADOWFOLD", "MEADOWFOLD", "merge", "meadow", "草原フォールド", "落ち着いた合成。", { size: 4, goal: 1024 }],
  // idle
  ["11_ORECLICK", "ORECLICK", "idle", "magma", "鉱石クリッカー", "タップと自動採掘で帝国を回せ。", { unit: "ore", tap: 1 }],
  ["12_CAFEIDLE", "CAFEIDLE", "idle", "sand", "カフェ放置", "コーヒーを売りまくれ。", { unit: "cup", tap: 1 }],
  ["13_FISHFARM", "FISHFARM", "idle", "ice", "養魚アイドル", "魚を増やして売却。", { unit: "fish", tap: 1 }],
  ["14_STARMINER", "STARMINER", "idle", "neon", "恒星採掘", "宇宙資源クリック。", { unit: "dust", tap: 2 }],
  ["15_BAKELOOP", "BAKELOOP", "idle", "candy", "焼き置き", "パンを量産。", { unit: "loaf", tap: 1 }],
  ["16_LUMBERTY", "LUMBERTY", "idle", "meadow", "木材タイクーン", "森を回せ。", { unit: "log", tap: 1 }],
  ["17_BYTEFARM", "BYTEFARM", "idle", "dusk", "バイト農場", "データセンター放置。", { unit: "MB", tap: 1 }],
  ["18_INKPRESS", "INKPRESS", "idle", "ink", "印刷所", "新聞を刷れ。", { unit: "page", tap: 1 }],
  ["19_HONEYHIVE", "HONEYHIVE", "idle", "orchard", "蜂蜜ハイブ", "ハチミツ生産。", { unit: "jar", tap: 1 }],
  ["20_SCRAPYARD", "SCRAPYARD", "idle", "paper", "スクラップ置き", "廃材クリック。", { unit: "scrap", tap: 1 }],
  // survivor
  ["21_NIGHTSWARM", "NIGHTSWARM", "survivor", "neon", "サバイバー夜戦", "自動攻撃で群れを薙ぎ払え。", {}],
  ["22_FROSTHORDE", "FROSTHORDE", "survivor", "ice", "氷の大群", "凍てつく平原を生き延びろ。", {}],
  ["23_EMBERMOB", "EMBERMOB", "survivor", "magma", "残火モブ", "炎の敵を狩れ。", {}],
  ["24_LEAFRAID", "LEAFRAID", "survivor", "orchard", "木葉レイド", "森の侵入者を撃退。", {}],
  ["25_VOIDCRAWL", "VOIDCRAWL", "survivor", "ink", "ヴォイドクロール", "闇を切り開け。", {}],
  ["26_CANDYSIEGE", "CANDYSIEGE", "survivor", "candy", "キャンディ攻城", "甘い戦場。", {}],
  ["27_DUNESURVIVE", "DUNESURVIVE", "survivor", "sand", "砂丘サバイブ", "砂漠の波状攻撃。", {}],
  ["28_MEADOWMAY", "MEADOWMAY", "survivor", "meadow", "草原防衛戦", "開放地を走れ。", {}],
  ["29_PIXELHUNT", "PIXELHUNT", "survivor", "dusk", "ピクセルハント", "ネオン弾幕回避＋反撃。", {}],
  ["30_PAPERPANIC", "PAPERPANIC", "survivor", "paper", "紙飛行パニック", "明るいフィールドで生存。", {}],
  // tower
  ["31_PATHGUARD", "PATHGUARD", "tower", "orchard", "進路防衛", "砲台を置いてウェーブを防げ。", {}],
  ["32_ICEBASTION", "ICEBASTION", "tower", "ice", "氷の砦", "冷気砲台で防衛。", {}],
  ["33_LAVAWALL", "LAVAWALL", "tower", "magma", "溶岩防壁", "熱い防衛線。", {}],
  ["34_NEONGRID", "NEONGRID", "tower", "neon", "ネオングリッドTD", "サイバー防衛。", {}],
  ["35_SANDLINE", "SANDLINE", "tower", "sand", "砂の防衛線", "砂漠ルート防衛。", {}],
  ["36_INKKEEP", "INKKEEP", "tower", "ink", "インクの砦", "モノクロTD。", {}],
  ["37_CANDYCASTLE", "CANDYCASTLE", "tower", "candy", "キャンディ城", "甘口タワーディフェンス。", {}],
  ["38_MEADOWGATE", "MEADOWGATE", "tower", "meadow", "草原ゲート", "自然派TD。", {}],
  ["39_DUSKWATCH", "DUSKWATCH", "tower", "dusk", "黄昏の監視", "夜の防衛。", {}],
  ["40_PAPERFORT", "PAPERFORT", "tower", "paper", "紙の砦", "明るいTD。", {}],
  // word
  ["41_WORDVEIL", "WORDVEIL", "word", "dusk", "単語ベール", "5文字英単語を6手で当てろ。", { len: 5 }],
  ["42_LEXILAMP", "LEXILAMP", "word", "paper", "語彙ランプ", "紙面ワードル。", { len: 5 }],
  ["43_RUNEGUESS", "RUNEGUESS", "word", "neon", "ルーン推測", "ネオン単語当て。", { len: 5 }],
  ["44_COLDTYPE", "COLDTYPE", "word", "ice", "コールドタイプ", "氷語パズル。", { len: 5 }],
  ["45_EMBERWORD", "EMBERWORD", "word", "magma", "残火ワード", "熱語推測。", { len: 5 }],
  ["46_LEAFSPELL", "LEAFSPELL", "word", "orchard", "木の葉スペル", "自然ワード。", { len: 5 }],
  ["47_SANDSCRIPT", "SANDSCRIPT", "word", "sand", "砂文字", "砂漠の単語。", { len: 5 }],
  ["48_INKRIDDLE", "INKRIDDLE", "word", "ink", "インク謎", "暗色ワードル。", { len: 5 }],
  ["49_SWEETWORD", "SWEETWORD", "word", "candy", "スイートワード", "甘い単語当て。", { len: 5 }],
  ["50_FIELDLEX", "FIELDLEX", "word", "meadow", "フィールド語彙", "草原ワード。", { len: 5 }],
  // quiz
  ["51_QUICKQUIZ", "QUICKQUIZ", "quiz", "paper", "クイッククイズ", "一般教養をタップで解答。", {}],
  ["52_BRAINPOP", "BRAINPOP", "quiz", "candy", "ブレインポップ", "テンポ良い四択。", {}],
  ["53_NIGHTTRIVIA", "NIGHTTRIVIA", "quiz", "dusk", "ナイトトリビア", "夜の雑学王。", {}],
  ["54_ICEIQ", "ICEIQ", "quiz", "ice", "アイスIQ", "冷静に解け。", {}],
  ["55_FIREFACT", "FIREFACT", "quiz", "magma", "ファイアファクト", "熱血クイズ。", {}],
  ["56_LEAFLORE", "LEAFLORE", "quiz", "orchard", "リーフロア", "自然雑学。", {}],
  ["57_NEONQ", "NEONQ", "quiz", "neon", "ネオンQ", "サイバー四択。", {}],
  ["58_SANDSMART", "SANDSMART", "quiz", "sand", "サンドスマート", "砂漠の知恵。", {}],
  ["59_INKTEST", "INKTEST", "quiz", "ink", "インクテスト", "暗色クイズ。", {}],
  ["60_MEADOWMIND", "MEADOWMIND", "quiz", "meadow", "メドウマインド", "草原クイズ。", {}],
  // runner
  ["61_LANEDASH", "LANEDASH", "runner", "dusk", "レーンダッシュ", "3レーン回避ラン。コインも取れ。", {}],
  ["62_FROSTRUN", "FROSTRUN", "runner", "ice", "フロストラン", "氷のコースを走れ。", {}],
  ["63_EMBERDASH", "EMBERDASH", "runner", "magma", "エンバーダッシュ", "炎障害を避けろ。", {}],
  ["64_NEONRUN", "NEONRUN", "runner", "neon", "ネオンラン", "サイバーランナー。", {}],
  ["65_SANDSPRINT", "SANDSPRINT", "runner", "sand", "サンドスプリント", "砂丘ダッシュ。", {}],
  ["66_LEAFLEAP", "LEAFLEAP", "runner", "orchard", "リーフリープ", "森のレーン走。", {}],
  ["67_INKRUN", "INKRUN", "runner", "ink", "インクラン", "モノクロ疾走。", {}],
  ["68_CANDYRUN", "CANDYRUN", "runner", "candy", "キャンディラン", "甘い障害物。", {}],
  ["69_MEADOWRUSH", "MEADOWRUSH", "runner", "meadow", "メドウラッシュ", "草原スプリント。", {}],
  ["70_PAPERRACE", "PAPERRACE", "runner", "paper", "ペーパーレース", "明るいラン。", {}],
  // card
  ["71_BLADECARD", "BLADECARD", "card", "magma", "ブレイドカード", "コスト管理カードバトル。", {}],
  ["72_AETHERDUEL", "AETHERDUEL", "card", "neon", "エーテルデュエル", "魔法カード対決。", {}],
  ["73_FROSTDECK", "FROSTDECK", "card", "ice", "フロストデッキ", "氷属性デッキ。", {}],
  ["74_LEAFCLASH", "LEAFCLASH", "card", "orchard", "リーフクラッシュ", "自然デッキ。", {}],
  ["75_INKWAR", "INKWAR", "card", "ink", "インクウォー", "暗色カード戦。", {}],
  ["76_SWEETDUEL", "SWEETDUEL", "card", "candy", "スイートデュエル", "甘口バトル。", {}],
  ["77_DUNEHAND", "DUNEHAND", "card", "sand", "デューンハンド", "砂漠デッキ。", {}],
  ["78_MEADOWDECK", "MEADOWDECK", "card", "meadow", "メドウデッキ", "草原カード。", {}],
  ["79_DUSKHAND", "DUSKHAND", "card", "dusk", "ダスクハンド", "黄昏デュエル。", {}],
  ["80_PAPERDUEL", "PAPERDUEL", "card", "paper", "ペーパーデュエル", "明るいカード戦。", {}],
  // sudoku
  ["81_SUDOKUCORE", "SUDOKUCORE", "sudoku", "paper", "数独コア", "9×9を埋めろ。与えマスは固定。", { holes: 40 }],
  ["82_NIGHTSUDO", "NIGHTSUDO", "sudoku", "dusk", "ナイト数独", "夜の数独。", { holes: 42 }],
  ["83_ICESUDO", "ICESUDO", "sudoku", "ice", "アイス数独", "冷静盤面。", { holes: 38 }],
  ["84_INKSUDO", "INKSUDO", "sudoku", "ink", "インク数独", "コントラスト強め。", { holes: 40 }],
  ["85_LEAFSUDO", "LEAFSUDO", "sudoku", "orchard", "リーフ数独", "自然テーマ。", { holes: 36 }],
  ["86_NEONSUDO", "NEONSUDO", "sudoku", "neon", "ネオン数独", "サイバー数独。", { holes: 44 }],
  ["87_SANDSUDO", "SANDSUDO", "sudoku", "sand", "サンド数独", "砂漠の盤。", { holes: 40 }],
  ["88_MAGMASUDO", "MAGMASUDO", "sudoku", "magma", "マグマ数独", "熱い数独。", { holes: 42 }],
  ["89_CANDYSUDO", "CANDYSUDO", "sudoku", "candy", "キャンディ数独", "甘い難易度。", { holes: 38 }],
  ["90_MEADOWSUDO", "MEADOWSUDO", "sudoku", "meadow", "メドウ数独", "草原盤。", { holes: 40 }],
  // farm
  ["91_PLOTPATCH", "PLOTPATCH", "farm", "orchard", "畑パッチ", "植え付け→成熟→収穫の農場。", {}],
  ["92_BERRYGRID", "BERRYGRID", "farm", "candy", "ベリーグリッド", "甘い作物経営。", {}],
  ["93_FROSTFARM", "FROSTFARM", "farm", "ice", "フロストファーム", "寒冷地農業。", {}],
  ["94_DUNEFIELD", "DUNEFIELD", "farm", "sand", "デューンフィールド", "砂の畑。", {}],
  ["95_NEONGROW", "NEONGROW", "farm", "neon", "ネオングロウ", "人工栽培。", {}],
  ["96_INKSOIL", "INKSOIL", "farm", "ink", "インクソイル", "モノクロ農場。", {}],
  ["97_EMBERPLOT", "EMBERPLOT", "farm", "magma", "エンバープロット", "火山灰土壌。", {}],
  ["98_DUSKCROP", "DUSKCROP", "farm", "dusk", "ダスククロップ", "夕暮れ農場。", {}],
  ["99_PAPERFARM", "PAPERFARM", "farm", "paper", "ペーパーファーム", "明るい農場。", {}],
  ["100_MEADOWPLOT", "MEADOWPLOT", "farm", "meadow", "メドウプロット", "草原農場シミュ。", {}]
];

const KIND_META = {
  merge: {
    keys: ["<kbd>←↑→↓</kbd><span>スワイプ合成</span>"],
    rules: ["同じ数同士が合体して倍に", "空きが無く動けなければ終了"]
  },
  idle: {
    keys: ["<span>オーブをクリックで採掘</span>", "<span>右の強化カードで購入</span>"],
    rules: ["自動収入は強化で増加", "コインは永続（セッション内）"]
  },
  survivor: {
    keys: ["<kbd>WASD</kbd>/<kbd>矢印</kbd><span>移動</span>"],
    rules: ["攻撃は自動", "宝石でレベルアップ"]
  },
  tower: {
    keys: ["<span>空き地クリックで砲台 $40</span>"],
    rules: ["進路には置けない", "ウェーブを生き延びろ"]
  },
  word: {
    keys: ["<kbd>A-Z</kbd><span>入力</span>", "<kbd>Enter</kbd><span>確定</span>", "<kbd>⌫</kbd><span>削除</span>"],
    rules: ["緑=位置正解 / 黄=文字のみ", "6回まで"]
  },
  quiz: {
    keys: ["<span>選択肢をクリック</span>"],
    rules: ["全問終了でスコア確定"]
  },
  runner: {
    keys: ["<kbd>←→</kbd>/<kbd>A D</kbd><span>レーン</span>"],
    rules: ["障害回避・コイン取得", "HP0で終了"]
  },
  card: {
    keys: ["<span>カードクリック</span>", "<kbd>E</kbd><span>ターン終了</span>"],
    rules: ["エネルギー内でプレイ", "敵HP0で勝利"]
  },
  sudoku: {
    keys: ["<span>マス選択</span>", "<kbd>1-9</kbd><span>入力</span>"],
    rules: ["太線ブロックも1-9ユニーク", "すべて埋めて正当ならクリア"]
  },
  farm: {
    keys: ["<span>右で作物選択→畑クリック</span>"],
    rules: ["成熟（光る）で収穫", "日が進むと少額ボーナス"]
  }
};

function shellCss(theme) {
  return `:root{
  --bg:${theme.bg};--panel:${theme.panel};--ink:${theme.ink};--muted:${theme.muted};
  --accent:${theme.accent};--accent2:${theme.accent2};--line:${theme.line};
  --font-d:'Outfit',system-ui,sans-serif;--font-b:'Zen Maru Gothic','Hiragino Sans',sans-serif;
}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--ink);font-family:var(--font-b)}
body{background:
  radial-gradient(900px 500px at 10% -10%,${theme.glow},transparent 55%),
  radial-gradient(700px 400px at 100% 0%,${theme.glow2},transparent 50%),
  linear-gradient(160deg,${theme.bg},${theme.bg2});
}
.shell{max-width:1100px;margin:0 auto;padding:28px 20px 48px}
.eyebrow{margin:0;letter-spacing:.14em;text-transform:uppercase;font:700 .72rem var(--font-d);color:var(--accent)}
h1{margin:.2rem 0 .4rem;font:800 clamp(2rem,5vw,3.1rem)/1 var(--font-d)}
.lead{margin:0;max-width:40rem;color:var(--muted);line-height:1.55}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px}
@media(max-width:860px){.layout{grid-template-columns:1fr}}
.board-wrap,.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:14px}
canvas{display:block;width:100%;height:auto;border-radius:12px;background:#000;touch-action:none}
.status{margin:10px 0 0;color:var(--muted);font-size:.92rem;min-height:1.4em}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.stat{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:12px;padding:10px}
.stat span{display:block;font:700 .68rem var(--font-d);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.stat strong{font:800 1.35rem/1.1 var(--font-d)}
button{appearance:none;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--ink);border-radius:12px;padding:10px 12px;font:700 .95rem var(--font-b);cursor:pointer;width:100%;margin-top:8px}
button.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:#111}
.keys,.rules{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:6px;color:var(--muted);font-size:.85rem}
.keys kbd{display:inline-block;min-width:1.5em;padding:2px 6px;margin-right:4px;border:1px solid var(--line);border-radius:6px;font:700 .75rem var(--font-d);color:var(--ink)}
.rules{padding-left:1.1rem;list-style:disc}
`;
}

function indexHtml(g) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${g.brand} — VELQUIA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="shell">
    <header>
      <p class="eyebrow">Market demand · ${g.tag}</p>
      <h1>${g.brand}</h1>
      <p class="lead">${g.lead}</p>
    </header>
    <div class="layout">
      <section class="board-wrap">
        <canvas id="board" width="720" height="480" aria-label="${g.brand}"></canvas>
        <p id="status" class="status">はじめるを押してスタート</p>
      </section>
      <aside class="panel">
        <div class="stat-grid">
          <div class="stat"><span>スコア</span><strong id="score">0</strong></div>
          <div class="stat"><span>ベスト</span><strong id="best">0</strong></div>
          <div class="stat"><span>状態値</span><strong id="lives">-</strong></div>
          <div class="stat"><span>フェーズ</span><strong id="phase">READY</strong></div>
        </div>
        <button id="btn-start" class="primary" type="button">はじめる</button>
        <button id="btn-pause" type="button">一時停止</button>
        <ul class="keys" id="keys"></ul>
        <ul class="rules" id="rules"></ul>
      </aside>
    </div>
  </main>
  <script src="game.js"></script>
  <script src="engine.js"></script>
</body>
</html>
`;
}

function gameJs(g, theme, km) {
  return `"use strict";
window.VQ_MARKET = ${JSON.stringify({
    brand: g.brand,
    kind: g.kind,
    key: "vq_mkt_" + g.brand.toLowerCase() + "_v1",
    theme,
    params: g.params || {},
    lead: g.lead,
    keys: km.keys,
    rules: km.rules
  }, null, 2)};
`;
}

function readme(g, port, themeName) {
  return `# ${g.brand}

> VELQUIA / 200_MARKET_GAMES · ${g.tag}

## 概要

${g.lead}

需要の高いジャンル（\`${g.kind}\`）向けに、タイトル画面・HUD・パーティクル・ベストスコア保存まで含めたプレイ可能ビルドです。

## 操作・ルール

${(KIND_META[g.kind].keys || []).map((k) => `- ${k.replace(/<[^>]+>/g, "")}`).join("\n")}

${(KIND_META[g.kind].rules || []).map((r) => `- ${r}`).join("\n")}

## 起動

\`\`\`
start-server.bat
\`\`\`

→ http://127.0.0.1:${port}/

## 技術

| ファイル | 役割 |
|----------|------|
| \`game.js\` | タイトル固有設定（VQ_MARKET） |
| \`engine.js\` | 本格Canvasエンジン（kind分岐） |
| \`style.css\` | テーマ \`${themeName}\` |
| \`vq-server.js\` | ローカル静的サーバ |

Relixia 本体は変更しません。
`;
}

function bat(g, port) {
  return `@echo off
cd /d "%~dp0"
echo Starting ${g.brand} on port ${port} ...
set PORT=${port}
set VQ_OPEN=1
node vq-server.js
pause
`;
}

if (!fs.existsSync(ENGINE_SRC) || !fs.existsSync(SERVER_SRC)) {
  console.error("missing engine or server template");
  process.exit(1);
}

const engine = fs.readFileSync(ENGINE_SRC, "utf8");
const server = fs.readFileSync(SERVER_SRC, "utf8");

fs.mkdirSync(ROOT, { recursive: true });
const ports = [];
let n = 0;

for (let i = 0; i < CATALOG.length; i++) {
  const [dir, brand, kind, themeName, tag, lead, params] = CATALOG[i];
  const port = 5301 + i;
  const theme = THEMES[themeName];
  const km = KIND_META[kind];
  const g = { dir, brand, kind, tag, lead, params };
  const dest = path.join(ROOT, dir);
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, "index.html"), indexHtml(g), "utf8");
  fs.writeFileSync(path.join(dest, "style.css"), shellCss(theme), "utf8");
  fs.writeFileSync(path.join(dest, "game.js"), gameJs(g, theme, km), "utf8");
  fs.writeFileSync(path.join(dest, "engine.js"), engine, "utf8");
  fs.writeFileSync(path.join(dest, "vq-server.js"), server, "utf8");
  fs.writeFileSync(path.join(dest, "port.txt"), String(port), "utf8");
  fs.writeFileSync(path.join(dest, "start-server.bat"), bat(g, port), "utf8");
  fs.writeFileSync(
    path.join(dest, "product.json"),
    JSON.stringify({ id: "200_MARKET_GAMES/" + dir, brand, kind, genre: tag, port, theme: themeName, standalone: true, version: "1.0.0" }, null, 2),
    "utf8"
  );
  fs.writeFileSync(path.join(dest, "README.md"), readme(g, port, themeName), "utf8");
  ports.push(`${port}\t${dir}\t${brand}\t${kind}`);
  n++;
  console.log("created", dir, kind, port);
}

fs.writeFileSync(path.join(ROOT, "PORTS.txt"), ports.join("\n") + "\n", "utf8");
fs.writeFileSync(
  path.join(ROOT, "README.md"),
  `# 200_MARKET_GAMES

需要の高いジャンルから集めた **${n}** 本のプレイ可能ゲームです（アーケード小品よりエンジン厚め）。

## ジャンル内訳（各10）

| kind | 系統 |
|------|------|
| merge | 2048系合成 |
| idle | クリッカー / 放置 |
| survivor | サバイバー（自動攻撃） |
| tower | タワーディフェンス |
| word | ワードル系 |
| quiz | 四択クイズ |
| runner | 3レーンラン |
| card | カードバトル |
| sudoku | 数独 |
| farm | 農場シミュ |

ポートは \`5301\` 〜。各タイトルの \`README.md\` / \`start-server.bat\` を参照。

Relixia（\`01_PROJECT\`）は非対象・非破壊です。
`,
  "utf8"
);

console.log("done", n, "games →", ROOT);
