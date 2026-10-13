"use strict";
/**
 * Apps 40窶・9 窶・tools inspired by existing VELQUIA games (Relixia files untouched).
 * Sources: Relixia cast concept, Tetoris, Rythom, Party(Jinro/WordWolf), Musuking,
 * Matching/Aisho, Cooking, Fashion, Boardgame trials, Travel/Present, RPG.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SHARED = path.join(ROOT, "_APP_SHARED");
const LIBS = ["shell.css", "ai.js", "i18n.js", "app-kit.js"];

const APPS = [
  {
    dir: "40_CAST_BIBLE",
    brand: "CastBible",
    sub: "From RELIXIA cast craft",
    based: "01_PROJECT / RELIXIA 窶・FROZEN eTerNITY",
    title: { en: "Civilization cast bible", ja: "譁・・繧ｭ繝｣繝ｩ蜿ｰ蟶ｳ" },
    lead: {
      en: "Roster mythic casts by civilization 窶・inspired by Relixia character craft (does not edit Relixia files).",
      ja: "Relixia縺ｮ繧ｭ繝｣繝ｩ險ｭ險医↓逹諠ｳ縺励◆譁・・蛻･繧ｭ繝｣繝ｩ蜿ｰ蟶ｳ・・elixia譛ｬ菴薙・螟画峩縺励∪縺帙ｓ・峨・
    },
    nav: [["roster", "Roster", "蜷咲ｰｿ"], ["civ", "Civilizations", "譁・・"], ["export", "Export", "蜃ｺ蜉・]],
    key: "vq_castbible_v1",
    kind: "cast"
  },
  {
    dir: "41_PUZZLE_LAB",
    brand: "PuzzleLab",
    sub: "From 荳芽ｧ偵ユ繝医Μ繧ｹ / TETORIS",
    based: "02_PUZZLE / 01_TETORIS",
    title: { en: "Triangle piece lab", ja: "荳芽ｧ偵ヴ繝ｼ繧ｹ遐皮ｩｶ謇" },
    lead: {
      en: "Balance Tetoris-style polyiamonds: piece sets, gravity notes, difficulty curves.",
      ja: "荳芽ｧ偵ユ繝医Μ繧ｹ邉ｻ繝斐・繧ｹ縺ｮ蜃ｺ迴ｾ邇・・髮｣譏灘ｺｦ繧ｫ繝ｼ繝悶・豸亥悉繝｡繝｢繧定ｨｭ險医・
    },
    nav: [["pieces", "Pieces", "繝斐・繧ｹ"], ["curve", "Curve", "繧ｫ繝ｼ繝・], ["notes", "Notes", "繝｡繝｢"]],
    key: "vq_puzzlelab_v1",
    kind: "puzzle"
  },
  {
    dir: "42_BEAT_FORGE",
    brand: "BeatForge",
    sub: "From RYTHOM",
    based: "03_RHYTHM / 01_RYTHOM",
    title: { en: "Rhythm chart forge", ja: "繝ｪ繧ｺ繝隴憺擇蟾･謌ｿ" },
    lead: {
      en: "Draft Rythom-style charts: BPM, lanes, density, and stage moods.",
      ja: "RYTHOM邉ｻ隴憺擇縺ｮBPM繝ｻ繝ｬ繝ｼ繝ｳ蟇・ｺｦ繝ｻ繧ｹ繝・・繧ｸ蠢・ュ繧定ｨｭ險医・
    },
    nav: [["chart", "Chart", "隴憺擇"], ["stages", "Stages", "繧ｹ繝・・繧ｸ"], ["export", "Export", "蜃ｺ蜉・]],
    key: "vq_beatforge_v1",
    kind: "rhythm"
  },
  {
    dir: "43_NIGHT_SCRIPT",
    brand: "NightScript",
    sub: "From JINRO / WORD WOLF",
    based: "05_PARTY / Jinro ﾂｷ Word Wolf",
    title: { en: "Party scenario writer", ja: "繝代・繝・ぅ繝ｼ繧ｷ繝翫Μ繧ｪ" },
    lead: {
      en: "Write werewolf / word-wolf style scenarios, roles, and night scripts.",
      ja: "莠ｺ迢ｼ繝ｻ繝ｯ繝ｼ繝峨え繝ｫ繝慕ｳｻ縺ｮ蠖ｹ閨ｷ驟榊・縺ｨ螟懊ヵ繧ｧ繧､繧ｺ蜿ｰ譛ｬ繧剃ｽ懈・縲・
    },
    nav: [["roles", "Roles", "蠖ｹ閨ｷ"], ["script", "Night script", "螟懷床譛ｬ"], ["words", "Word pack", "蜊倩ｪ・]],
    key: "vq_nightscript_v1",
    kind: "party"
  },
  {
    dir: "44_DECKLOOM",
    brand: "Deckloom",
    sub: "From MUSUKING",
    based: "06_CARD / 001_MUSUKING",
    title: { en: "Card set loom", ja: "繧ｫ繝ｼ繝峨そ繝・ヨ蟾･謌ｿ" },
    lead: {
      en: "Design Musuking-style character cards, rarities, and set lists.",
      ja: "繧縺吶く繝ｳ繧ｰ邉ｻ繧ｭ繝｣繝ｩ繧ｫ繝ｼ繝峨・繝ｬ繧｢蠎ｦ繝ｻ繧ｻ繝・ヨ繝ｪ繧ｹ繝医ｒ險ｭ險医・
    },
    nav: [["cards", "Cards", "繧ｫ繝ｼ繝・], ["sets", "Sets", "繧ｻ繝・ヨ"], ["balance", "Balance", "繝舌Λ繝ｳ繧ｹ"]],
    key: "vq_deckloom_v1",
    kind: "card"
  },
  {
    dir: "45_SPARK_MATCH",
    brand: "SparkMatch",
    sub: "From MATCHING / AISHO",
    based: "07ﾂｷ11_MATCHING ﾂｷ 08_AISHO",
    title: { en: "Match profile lab", ja: "繝槭ャ繝√Φ繧ｰ險ｭ螳壼ｮ､" },
    lead: {
      en: "Tune swipe profiles, affinity tags, and Aisho-style compatibility copy.",
      ja: "繝槭ャ繝√Φ繧ｰ繝励Ο繝輔ぅ繝ｼ繝ｫ繝ｻ逶ｸ諤ｧ繧ｿ繧ｰ繝ｻ諢帷ｧｰ繧ｳ繝斐・繧定ｪｿ謨ｴ縲・
    },
    nav: [["profiles", "Profiles", "繝励Ο繝・], ["tags", "Affinity", "逶ｸ諤ｧ"], ["copy", "Copy", "譁・｡・]],
    key: "vq_sparkmatch_v1",
    kind: "match"
  },
  {
    dir: "46_PANTRY_QUEST",
    brand: "PantryQuest",
    sub: "From COOKING",
    based: "09_COOKING",
    title: { en: "Recipe quest designer", ja: "繝ｬ繧ｷ繝斐け繧ｨ繧ｹ繝郁ｨｭ險・ },
    lead: {
      en: "Build cooking-game recipes, ingredient graphs, and star ratings.",
      ja: "譁咏炊繧ｲ繝ｼ繝縺ｮ繝ｬ繧ｷ繝斐・譚先侭繧ｰ繝ｩ繝輔・譏溯ｩ穂ｾ｡繧定ｨｭ險医・
    },
    nav: [["recipes", "Recipes", "繝ｬ繧ｷ繝・], ["graph", "Ingredients", "譚先侭"], ["stars", "Stars", "隧穂ｾ｡"]],
    key: "vq_pantryquest_v1",
    kind: "cook"
  },
  {
    dir: "47_ATELIER_DROP",
    brand: "AtelierDrop",
    sub: "From FASHION",
    based: "10_FASHION",
    title: { en: "Fashion drop planner", ja: "繝輔ぃ繝・す繝ｧ繝ｳDrop險育判" },
    lead: {
      en: "Plan fashion-game collections, looks, and seasonal drops.",
      ja: "繝輔ぃ繝・す繝ｧ繝ｳ繧ｲ繝ｼ繝縺ｮ繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ繝ｻ繝ｫ繝・け繝ｻ蟄｣遽Drop繧定ｨ育判縲・
    },
    nav: [["looks", "Looks", "繝ｫ繝・け"], ["drops", "Drops", "Drop"], ["palette", "Palette", "驟崎牡"]],
    key: "vq_atelierdrop_v1",
    kind: "fashion"
  },
  {
    dir: "48_TABLE_FORGE",
    brand: "TableForge",
    sub: "From BOARDGAME trials",
    based: "14_BOARDGAME ﾂｷ Islebound窶ｦCrownstack",
    title: { en: "Boardgame playtest desk", ja: "繝懊ラ繧ｲ繝励Ξ繧､繝・せ繝亥床" },
    lead: {
      en: "Track Islebound / Glint / Railspan / Mosaic / Crownstack playtest notes & balance.",
      ja: "ISLEBOUND縲廚ROWNSTACK縺ｮ繝励Ξ繧､繝・せ繝郁ｨ倬鹸縺ｨ繝舌Λ繝ｳ繧ｹ隱ｿ謨ｴ縲・
    },
    nav: [["titles", "Titles", "繧ｿ繧､繝医Ν"], ["sessions", "Sessions", "繧ｻ繝・す繝ｧ繝ｳ"], ["balance", "Balance", "隱ｿ謨ｴ"]],
    key: "vq_tableforge_v1",
    kind: "board"
  },
  {
    dir: "49_WAYFARE",
    brand: "Wayfare",
    sub: "From TRAVEL ﾂｷ PRESENT ﾂｷ RPG",
    based: "13_TRAVEL ﾂｷ 12_PRESENT ﾂｷ 04_RPG",
    title: { en: "Route & gift quests", ja: "譌・ｷｯ繝ｻ雍育ｭ斐け繧ｨ繧ｹ繝・ },
    lead: {
      en: "Design travel routes, gift beats, and light RPG quest steps.",
      ja: "譌・｡後Ν繝ｼ繝医√・繝ｬ繧ｼ繝ｳ繝域ｼ泌・縲∬ｻｽ縺СPG繧ｯ繧ｨ繧ｹ繝域焔鬆・ｒ險ｭ險医・
    },
    nav: [["routes", "Routes", "繝ｫ繝ｼ繝・], ["gifts", "Gifts", "雍育ｭ・], ["quests", "Quests", "繧ｯ繧ｨ繧ｹ繝・]],
    key: "vq_wayfare_v1",
    kind: "travel"
  }
];

function copyLibs(dest) {
  LIBS.forEach((f) => fs.copyFileSync(path.join(SHARED, f), path.join(dest, f)));
}

function indexHtml(app) {
  const nav = app.nav
    .map((n, i) => `      <button class="nav-btn${i ? "" : " active"}" data-view="${n[0]}" data-i18n="nav_${n[0]}">${n[1]}</button>`)
    .join("\n");
  const views = app.nav
    .map((n, i) => `      <section id="view-${n[0]}" class="section-enter${i ? " hidden" : ""}"></section>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#06060a">
  <title>${app.brand} 窶・VELQUIA</title>
  <link rel="stylesheet" href="shell.css">
</head>
<body>
  <div class="app">
    <aside class="side">
      <div class="brand">${app.brand}<small data-i18n="sub">${app.sub}</small></div>
      <p class="nav-label" data-i18n="based_label">Based on</p>
      <p class="mini" style="padding:0 10px 10px;margin:0" data-i18n="based">${app.based}</p>
${nav}
      <div class="side-foot">
        <span data-i18n="foot2">Standalone ﾂｷ standalone</span>
      </div>
    </aside>
    <main class="main">
      <div class="workspace-banner">
        <div><span class="status-dot"></span><strong>${app.brand}</strong> ﾂｷ <span data-i18n="banner">Studio tool</span></div>
        <span class="badge ok" data-i18n="live">Local live</span>
      </div>
      <div class="top">
        <div>
          <h1 data-i18n="title">${app.title.en}</h1>
          <p data-i18n="lead">${app.lead.en}</p>
        </div>
        <div class="top-actions">
          <button type="button" class="primary" id="btn-primary" data-i18n="btn_primary">Run AI</button>
          <button type="button" id="btn-seed" data-i18n="btn_seed">Seed from games</button>
        </div>
      </div>
${views}
    </main>
  </div>
  <script src="strings.js"></script>
  <script src="i18n.js"></script>
  <script src="ai.js"></script>
  <script src="app-kit.js"></script>
  <script src="app.js"></script>
  <script src="features.js"></script>
</body>
</html>
`;
}

function stringsJs(app) {
  const en = { sub: app.sub, title: app.title.en, lead: app.lead.en, based: app.based, based_label: "Based on", foot: "App lineup", foot2: "Standalone ﾂｷ standalone", banner: "Studio tool", live: "Local live", btn_primary: "Run AI", btn_seed: "Seed from games" };
  const ja = { sub: app.sub, title: app.title.ja, lead: app.lead.ja, based: app.based, based_label: "蜈・ご繝ｼ繝", foot: "繧｢繝励Μ荳隕ｧ", foot2: "繧ｲ繝ｼ繝騾｣蜍・ﾂｷ 迢ｬ遶・, banner: "繧ｲ繝ｼ繝蛻ｶ菴懊ヤ繝ｼ繝ｫ", live: "繝ｭ繝ｼ繧ｫ繝ｫ遞ｼ蜒・, btn_primary: "AI螳溯｡・, btn_seed: "繧ｲ繝ｼ繝縺九ｉ謚募・" };
  app.nav.forEach((n) => {
    en["nav_" + n[0]] = n[1];
    ja["nav_" + n[0]] = n[2];
  });
  return `"use strict";\nwindow.VQ_STRINGS=${JSON.stringify({ en, ja }, null, 2)};\n`;
}

function appJs(app) {
  return `"use strict";
(function () {
  const KEY = ${JSON.stringify(app.key)};
  const KIND = ${JSON.stringify(app.kind)};
  const state = VQ.load(KEY, seedEmpty());

  function seedEmpty() {
    return {
      cast: { rows: [], civs: {} },
      puzzle: { pieces: [], curve: [], notes: [] },
      rhythm: { charts: [], stages: [] },
      party: { roles: [], script: [], words: [] },
      card: { cards: [], sets: [], rarity: {} },
      match: { profiles: [], tags: [], copy: [] },
      cook: { recipes: [], ingredients: [] },
      fashion: { looks: [], drops: [], palette: [] },
      board: { titles: [], sessions: [], tweaks: [] },
      travel: { routes: [], gifts: [], quests: [] }
    };
  }

  function save() { VQ.store(KEY, state); render(); }
  function host(id) { return document.getElementById("view-" + id); }
  function kpi(rows) {
    return '<div class="kpi-row">' + rows.map((r) =>
      '<div class="card"><div class="stat"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div></div>'
    ).join("") + "</div>";
  }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll("main section[id^=view-]").forEach((s) => {
        s.classList.toggle("hidden", s.id !== "view-" + btn.dataset.view);
      });
    };
  });

  function renderCast() {
    const rows = state.cast.rows;
    const civs = state.cast.civs;
    host("roster").innerHTML = kpi([
      ["Cast", rows.length],
      ["Civilizations", Object.keys(civs).length],
      ["JP myth", rows.filter((r) => /譌･譛ｬ|myth|JP/i.test(r.civ)).length],
      ["Ready", rows.length ? "yes" : "-"]
    ]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Add character</h2>
          <label>ID</label><input id="cb-id" placeholder="001_amaterasu">
          <label>Name</label><input id="cb-name" placeholder="螟ｩ辣ｧ">
          <label>Civilization</label><input id="cb-civ" placeholder="譌･譛ｬ逾櫁ｩｱ">
          <div class="actions"><button class="primary" id="cb-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Roster</h2><ul class="list" id="cb-list"></ul></div>
      </div>\`;
    host("civ").innerHTML = '<div class="card"><h2>By civilization</h2><div id="cb-bars"></div><div id="cb-donut" style="margin-top:12px"></div></div>';
    host("export").innerHTML = '<div class="card"><h2>CSV / notes</h2><pre class="preview" id="cb-out"></pre><div class="actions"><button id="cb-csv" type="button">Download CSV</button></div></div>';
    document.getElementById("cb-list").innerHTML = rows.map((r, i) =>
      '<li><div><strong>' + VQKit.escape(r.name) + '</strong><br><span class="muted">' + VQKit.escape(r.id) + ' ﾂｷ ' + VQKit.escape(r.civ) + '</span></div><button data-x="' + i + '">Del</button></li>'
    ).join("") || "<div class='empty'>Seed Relixia-style cast</div>";
    document.querySelectorAll("#cb-list [data-x]").forEach((b) => (b.onclick = () => { rows.splice(+b.dataset.x, 1); rebuildCiv(); save(); }));
    document.getElementById("cb-add").onclick = () => {
      rows.unshift({ id: document.getElementById("cb-id").value || VQ.uid(), name: document.getElementById("cb-name").value || "Untitled", civ: document.getElementById("cb-civ").value || "Unknown" });
      rebuildCiv(); save();
    };
    function rebuildCiv() {
      state.cast.civs = VQKit.groupCount(rows, (r) => r.civ);
    }
    rebuildCiv();
    document.getElementById("cb-bars").innerHTML = VQKit.barChart(state.cast.civs);
    document.getElementById("cb-donut").innerHTML = VQKit.donut(state.cast.civs, 140);
    document.getElementById("cb-out").textContent = "no,character_id,character_name,civilization\\n" + rows.map((r, i) =>
      String(i + 1).padStart(3, "0") + "," + r.id + ',"' + r.name + '","' + r.civ + '"'
    ).join("\\n");
    document.getElementById("cb-csv").onclick = () => VQKit.downloadCSV("castbible.csv", rows, [
      { label: "character_id", key: "id" }, { label: "character_name", key: "name" }, { label: "civilization", key: "civ" }
    ]);
  }

  function renderPuzzle() {
    const p = state.puzzle;
    host("pieces").innerHTML = kpi([["Pieces", p.pieces.length], ["Avg weight", p.pieces.length ? VQKit.avg(p.pieces.map((x) => x.weight)).toFixed(1) : "-"], ["Hard", p.pieces.filter((x) => x.weight >= 4).length], ["Notes", p.notes.length]]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Polyiamond piece</h2>
          <label>Name</label><input id="pz-name" placeholder="T5 skew">
          <label>Cells (3窶・)</label><input id="pz-cells" type="number" value="4">
          <label>Spawn weight</label><input id="pz-w" type="number" value="3">
          <div class="actions"><button class="primary" id="pz-add" type="button">Add piece</button></div>
        </div>
        <div class="card"><h2>Set</h2><ul class="list" id="pz-list"></ul></div>
      </div>\`;
    host("curve").innerHTML = '<div class="card"><h2>Difficulty curve (levels)</h2><div id="pz-spark"></div><ul class="list" id="pz-curve"></ul></div>';
    host("notes").innerHTML = '<div class="card"><h2>Design notes</h2><ul class="list" id="pz-notes"></ul></div>';
    document.getElementById("pz-list").innerHTML = p.pieces.map((x) => '<li><div><strong>' + VQKit.escape(x.name) + '</strong><br><span class="muted">' + x.cells + ' cells</span></div><span class="badge">w' + x.weight + '</span></li>').join("") || "<div class='empty'>Seed Tetoris pieces</div>";
    document.getElementById("pz-add").onclick = () => {
      p.pieces.push({ name: document.getElementById("pz-name").value || "Piece", cells: +document.getElementById("pz-cells").value || 4, weight: +document.getElementById("pz-w").value || 1 });
      save();
    };
    document.getElementById("pz-spark").innerHTML = VQKit.sparkline(p.curve.length ? p.curve : [1, 2, 2, 3, 4, 5], 280, 48, "#5fd4b3");
    document.getElementById("pz-curve").innerHTML = (p.curve.length ? p.curve : []).map((v, i) => '<li><div>Level ' + (i + 1) + '</div><span class="badge">speed ' + v + '</span></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("pz-notes").innerHTML = p.notes.map((n) => '<li><div>' + VQKit.escape(n) + '</div></li>').join("") || "<div class='empty'>No notes</div>";
  }

  function renderRhythm() {
    const r = state.rhythm;
    host("chart").innerHTML = kpi([["Charts", r.charts.length], ["Stages", r.stages.length], ["Avg BPM", r.charts.length ? Math.round(VQKit.avg(r.charts.map((c) => c.bpm))) : "-"], ["Density", r.charts[0] ? r.charts[0].density : "-"]]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>New chart</h2>
          <label>Title</label><input id="rh-title" placeholder="Night hills">
          <label>BPM</label><input id="rh-bpm" type="number" value="128">
          <label>Lanes</label><input id="rh-lanes" type="number" value="4">
          <label>Density 1窶・0</label><input id="rh-den" type="number" value="5">
          <div class="actions"><button class="primary" id="rh-add" type="button">Add chart</button></div>
        </div>
        <div class="card"><h2>Charts</h2><ul class="list" id="rh-list"></ul></div>
      </div>\`;
    host("stages").innerHTML = '<div class="card"><h2>Stage moods (Rythom-like)</h2><ul class="list" id="rh-stages"></ul></div>';
    host("export").innerHTML = '<div class="card"><h2>Chart JSON</h2><pre class="preview" id="rh-out"></pre></div>';
    document.getElementById("rh-list").innerHTML = r.charts.map((c) => '<li><div><strong>' + VQKit.escape(c.title) + '</strong><br><span class="muted">' + c.bpm + ' BPM ﾂｷ ' + c.lanes + ' lanes</span></div><span class="badge">d' + c.density + '</span></li>').join("") || "<div class='empty'>Seed Rythom charts</div>";
    document.getElementById("rh-add").onclick = () => {
      r.charts.unshift({ title: document.getElementById("rh-title").value || "Chart", bpm: +document.getElementById("rh-bpm").value || 120, lanes: +document.getElementById("rh-lanes").value || 4, density: +document.getElementById("rh-den").value || 5 });
      save();
    };
    document.getElementById("rh-stages").innerHTML = r.stages.map((s) => '<li><div><strong>' + VQKit.escape(s.name) + '</strong><br><span class="muted">' + VQKit.escape(s.mood) + '</span></div></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("rh-out").textContent = JSON.stringify(r.charts, null, 2);
  }

  function renderParty() {
    const p = state.party;
    host("roles").innerHTML = kpi([["Roles", p.roles.length], ["Script lines", p.script.length], ["Words", p.words.length], ["Players", p.roles.reduce((a, r) => a + (r.count || 0), 0)]]) + \`
      <div class="card">
        <h2>Role table (Jinro-style)</h2>
        <div class="toolbar">
          <input id="pt-role" placeholder="Werewolf" style="max-width:160px;margin:0">
          <input id="pt-n" type="number" value="2" style="max-width:80px;margin:0">
          <button class="primary" id="pt-add" type="button">Add role</button>
        </div>
        <ul class="list" id="pt-roles"></ul>
      </div>\`;
    host("script").innerHTML = '<div class="card"><h2>Night phase script</h2><ul class="list" id="pt-script"></ul></div>';
    host("words").innerHTML = '<div class="card"><h2>Word Wolf pack</h2><ul class="list" id="pt-words"></ul></div>';
    document.getElementById("pt-roles").innerHTML = p.roles.map((r) => '<li><div><strong>' + VQKit.escape(r.name) + '</strong></div><span class="badge">ﾃ・ + r.count + '</span></li>').join("") || "<div class='empty'>Seed party roles</div>";
    document.getElementById("pt-add").onclick = () => {
      p.roles.push({ name: document.getElementById("pt-role").value || "Villager", count: +document.getElementById("pt-n").value || 1 });
      save();
    };
    document.getElementById("pt-script").innerHTML = p.script.map((l, i) => '<li><div>' + VQKit.escape(l) + '</div><span class="badge">N' + (i + 1) + '</span></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("pt-words").innerHTML = p.words.map((w) => '<li><div><strong>' + VQKit.escape(w.majority) + '</strong> vs <strong>' + VQKit.escape(w.minority) + '</strong></div></li>').join("") || "<div class='empty'>Run AI</div>";
  }

  function renderCard() {
    const c = state.card;
    host("cards").innerHTML = kpi([["Cards", c.cards.length], ["Sets", c.sets.length], ["SSR", c.cards.filter((x) => x.rarity === "SSR").length], ["Avg ATK", c.cards.length ? Math.round(VQKit.avg(c.cards.map((x) => x.atk))) : "-"]]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Musuking-style card</h2>
          <label>Name</label><input id="dk-name" placeholder="譯懷ｭ・>
          <label>Rarity</label><select id="dk-r"><option>N</option><option>R</option><option>SR</option><option>SSR</option></select>
          <label>ATK</label><input id="dk-atk" type="number" value="1200">
          <div class="actions"><button class="primary" id="dk-add" type="button">Add card</button></div>
        </div>
        <div class="card"><h2>Card list</h2><ul class="list" id="dk-list"></ul></div>
      </div>\`;
    host("sets").innerHTML = '<div class="card"><h2>Sets</h2><ul class="list" id="dk-sets"></ul></div>';
    host("balance").innerHTML = '<div class="card"><h2>Rarity mix</h2><div id="dk-bars"></div><div id="dk-donut"></div></div>';
    document.getElementById("dk-list").innerHTML = c.cards.map((x) => '<li><div><strong>' + VQKit.escape(x.name) + '</strong></div><span class="badge">' + x.rarity + ' ﾂｷ ' + x.atk + '</span></li>').join("") || "<div class='empty'>Seed Musuking cards</div>";
    document.getElementById("dk-add").onclick = () => {
      c.cards.unshift({ name: document.getElementById("dk-name").value || "Card", rarity: document.getElementById("dk-r").value, atk: +document.getElementById("dk-atk").value || 0 });
      save();
    };
    document.getElementById("dk-sets").innerHTML = c.sets.map((s) => '<li><div>' + VQKit.escape(s) + '</div></li>').join("") || "<div class='empty'>Run AI</div>";
    const mix = VQKit.groupCount(c.cards, (x) => x.rarity);
    document.getElementById("dk-bars").innerHTML = VQKit.barChart(mix);
    document.getElementById("dk-donut").innerHTML = VQKit.donut(mix, 130);
  }

  function renderMatch() {
    const m = state.match;
    host("profiles").innerHTML = kpi([["Profiles", m.profiles.length], ["Tags", m.tags.length], ["Copy", m.copy.length], ["Avg vibe", m.profiles.length ? Math.round(VQKit.avg(m.profiles.map((p) => p.vibe))) : "-"]]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Profile</h2>
          <label>Name</label><input id="sm-name" placeholder="Hina">
          <label>Bio</label><textarea id="sm-bio" placeholder="Loves late trains and quiet cafﾃｩs"></textarea>
          <label>Vibe 1窶・00</label><input id="sm-vibe" type="number" value="72">
          <div class="actions"><button class="primary" id="sm-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Profiles</h2><ul class="list" id="sm-list"></ul></div>
      </div>\`;
    host("tags").innerHTML = '<div class="card"><h2>Affinity tags</h2><div class="chips" id="sm-tags"></div></div>';
    host("copy").innerHTML = '<div class="card"><h2>Match / Aisho copy</h2><ul class="list" id="sm-copy"></ul></div>';
    document.getElementById("sm-list").innerHTML = m.profiles.map((p) => '<li><div><strong>' + VQKit.escape(p.name) + '</strong><br><span class="muted">' + VQKit.escape(p.bio) + '</span></div><span class="badge">' + p.vibe + '</span></li>').join("") || "<div class='empty'>Seed matching profiles</div>";
    document.getElementById("sm-add").onclick = () => {
      m.profiles.unshift({ name: document.getElementById("sm-name").value || "User", bio: document.getElementById("sm-bio").value || "", vibe: +document.getElementById("sm-vibe").value || 50 });
      save();
    };
    document.getElementById("sm-tags").innerHTML = m.tags.map((t) => '<button class="chip-btn" type="button">' + VQKit.escape(t) + '</button>').join("") || "<span class='muted'>Run AI</span>";
    document.getElementById("sm-copy").innerHTML = m.copy.map((c) => '<li><div>' + VQKit.escape(c) + '</div></li>').join("") || "<div class='empty'>Run AI</div>";
  }

  function renderCook() {
    const c = state.cook;
    host("recipes").innerHTML = kpi([["Recipes", c.recipes.length], ["Ingredients", c.ingredients.length], ["Avg stars", c.recipes.length ? VQKit.avg(c.recipes.map((r) => r.stars)).toFixed(1) : "-"], ["Hard", c.recipes.filter((r) => r.stars >= 4).length]]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Recipe</h2>
          <label>Name</label><input id="cq-name" placeholder="蜻ｳ蝎後Λ繝ｼ繝｡繝ｳ">
          <label>Stars 1窶・</label><input id="cq-stars" type="number" value="3">
          <label>Steps</label><textarea id="cq-steps" placeholder="1. Boil窶ｦ"></textarea>
          <div class="actions"><button class="primary" id="cq-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Book</h2><ul class="list" id="cq-list"></ul></div>
      </div>\`;
    host("graph").innerHTML = '<div class="card"><h2>Ingredient graph</h2><div id="cq-bars"></div></div>';
    host("stars").innerHTML = '<div class="card"><h2>Star histogram</h2><div id="cq-hist"></div></div>';
    document.getElementById("cq-list").innerHTML = c.recipes.map((r) => '<li><div><strong>' + VQKit.escape(r.name) + '</strong><br><span class="muted">' + VQKit.escape((r.steps || "").slice(0, 80)) + '</span></div><span class="badge">' + "笘・.repeat(r.stars) + '</span></li>').join("") || "<div class='empty'>Seed cooking recipes</div>";
    document.getElementById("cq-add").onclick = () => {
      c.recipes.unshift({ name: document.getElementById("cq-name").value || "Dish", stars: +document.getElementById("cq-stars").value || 1, steps: document.getElementById("cq-steps").value || "" });
      save();
    };
    document.getElementById("cq-bars").innerHTML = VQKit.barChart(VQKit.groupCount(c.ingredients, (x) => x));
    document.getElementById("cq-hist").innerHTML = VQKit.histogram(c.recipes.map((r) => r.stars), 5);
  }

  function renderFashion() {
    const f = state.fashion;
    host("looks").innerHTML = kpi([["Looks", f.looks.length], ["Drops", f.drops.length], ["Palette", f.palette.length], ["Seasons", new Set(f.drops.map((d) => d.season)).size]]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Look</h2>
          <label>Name</label><input id="ad-name" placeholder="Midnight trench">
          <label>Style</label><select id="ad-style"><option>street</option><option>formal</option><option>soft</option><option>avant</option></select>
          <div class="actions"><button class="primary" id="ad-add" type="button">Add look</button></div>
        </div>
        <div class="card"><h2>Looks</h2><ul class="list" id="ad-list"></ul></div>
      </div>\`;
    host("drops").innerHTML = '<div class="card"><h2>Seasonal drops</h2><ul class="list" id="ad-drops"></ul></div>';
    host("palette").innerHTML = '<div class="card"><h2>Palette chips</h2><div class="chips" id="ad-pal"></div></div>';
    document.getElementById("ad-list").innerHTML = f.looks.map((l) => '<li><div><strong>' + VQKit.escape(l.name) + '</strong></div><span class="badge">' + l.style + '</span></li>').join("") || "<div class='empty'>Seed fashion looks</div>";
    document.getElementById("ad-add").onclick = () => {
      f.looks.unshift({ name: document.getElementById("ad-name").value || "Look", style: document.getElementById("ad-style").value });
      save();
    };
    document.getElementById("ad-drops").innerHTML = f.drops.map((d) => '<li><div><strong>' + VQKit.escape(d.name) + '</strong></div><span class="badge">' + d.season + '</span></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("ad-pal").innerHTML = f.palette.map((c) => '<button class="chip-btn" type="button" style="border-color:' + c + '">' + c + '</button>').join("") || "<span class='muted'>Run AI</span>";
  }

  function renderBoard() {
    const b = state.board;
    host("titles").innerHTML = kpi([["Titles", b.titles.length], ["Sessions", b.sessions.length], ["Tweaks", b.tweaks.length], ["Hot", b.sessions.filter((s) => s.score >= 4).length]]) +
      '<div class="card"><h2>Boardgame trials</h2><ul class="list" id="tf-titles"></ul></div>';
    host("sessions").innerHTML = \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Log session</h2>
          <label>Title</label><select id="tf-t"></select>
          <label>Score 1窶・</label><input id="tf-s" type="number" value="4">
          <label>Note</label><textarea id="tf-n" placeholder="Resource snowball too strong窶ｦ"></textarea>
          <div class="actions"><button class="primary" id="tf-add" type="button">Log</button></div>
        </div>
        <div class="card"><h2>Sessions</h2><ul class="list" id="tf-sess"></ul></div>
      </div>\`;
    host("balance").innerHTML = '<div class="card"><h2>Balance queue</h2><ul class="list" id="tf-tw"></ul><div id="tf-bars" style="margin-top:12px"></div></div>';
    document.getElementById("tf-titles").innerHTML = b.titles.map((t) => '<li><div><strong>' + VQKit.escape(t.id) + '</strong><br><span class="muted">' + VQKit.escape(t.blurb) + '</span></div></li>').join("") || "<div class='empty'>Seed boardgames</div>";
    const sel = document.getElementById("tf-t");
    sel.innerHTML = b.titles.map((t) => '<option>' + VQKit.escape(t.id) + '</option>').join("") || "<option>ISLEBOUND</option>";
    document.getElementById("tf-sess").innerHTML = b.sessions.map((s) => '<li><div><strong>' + VQKit.escape(s.title) + '</strong><br><span class="muted">' + VQKit.escape(s.note) + '</span></div><span class="badge">' + s.score + '笘・/span></li>').join("") || "<div class='empty'>No sessions</div>";
    document.getElementById("tf-add").onclick = () => {
      b.sessions.unshift({ title: sel.value, score: +document.getElementById("tf-s").value || 3, note: document.getElementById("tf-n").value || "", at: Date.now() });
      save();
    };
    document.getElementById("tf-tw").innerHTML = b.tweaks.map((t) => '<li><div>' + VQKit.escape(t) + '</div></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("tf-bars").innerHTML = VQKit.barChart(VQKit.groupCount(b.sessions, (s) => s.title));
  }

  function renderTravel() {
    const t = state.travel;
    host("routes").innerHTML = kpi([["Routes", t.routes.length], ["Gifts", t.gifts.length], ["Quests", t.quests.length], ["Days", t.routes.reduce((a, r) => a + (r.days || 0), 0)]]) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Travel route</h2>
          <label>Name</label><input id="wf-name" placeholder="Kyoto night walk">
          <label>Days</label><input id="wf-days" type="number" value="2">
          <label>Stops</label><textarea id="wf-stops" placeholder="Fushimi 竊・Gion 竊・Arashiyama"></textarea>
          <div class="actions"><button class="primary" id="wf-add" type="button">Add route</button></div>
        </div>
        <div class="card"><h2>Routes</h2><ul class="list" id="wf-routes"></ul></div>
      </div>\`;
    host("gifts").innerHTML = '<div class="card"><h2>Present beats</h2><ul class="list" id="wf-gifts"></ul></div>';
    host("quests").innerHTML = '<div class="card"><h2>RPG-lite quests</h2><ul class="list" id="wf-quests"></ul></div>';
    document.getElementById("wf-routes").innerHTML = t.routes.map((r) => '<li><div><strong>' + VQKit.escape(r.name) + '</strong><br><span class="muted">' + VQKit.escape(r.stops) + '</span></div><span class="badge">' + r.days + 'd</span></li>').join("") || "<div class='empty'>Seed travel routes</div>";
    document.getElementById("wf-add").onclick = () => {
      t.routes.unshift({ name: document.getElementById("wf-name").value || "Route", days: +document.getElementById("wf-days").value || 1, stops: document.getElementById("wf-stops").value || "" });
      save();
    };
    document.getElementById("wf-gifts").innerHTML = t.gifts.map((g) => '<li><div>' + VQKit.escape(g) + '</div></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("wf-quests").innerHTML = t.quests.map((q, i) => '<li><div><strong>Q' + (i + 1) + '</strong> ' + VQKit.escape(q) + '</div></li>').join("") || "<div class='empty'>Run AI</div>";
  }

  function render() {
    if (KIND === "cast") return renderCast();
    if (KIND === "puzzle") return renderPuzzle();
    if (KIND === "rhythm") return renderRhythm();
    if (KIND === "party") return renderParty();
    if (KIND === "card") return renderCard();
    if (KIND === "match") return renderMatch();
    if (KIND === "cook") return renderCook();
    if (KIND === "fashion") return renderFashion();
    if (KIND === "board") return renderBoard();
    if (KIND === "travel") return renderTravel();
  }

  async function runAI() {
    document.getElementById("btn-primary").disabled = true;
    await VQ.think(450);
    if (KIND === "cast") {
      if (!state.cast.rows.length) {
        state.cast.rows = [
          { id: "001_amaterasu", name: "螟ｩ辣ｧ", civ: "譌･譛ｬ逾櫁ｩｱ" },
          { id: "002_tsukuyomi", name: "譛郁ｪｭ", civ: "譌･譛ｬ逾櫁ｩｱ" },
          { id: "003_susanoo", name: "鬆井ｽ蝉ｹ狗塙", civ: "譌･譛ｬ逾櫁ｩｱ" },
          { id: "010_odin", name: "Odin", civ: "蛹玲ｬｧ逾櫁ｩｱ" },
          { id: "011_freya", name: "Freya", civ: "蛹玲ｬｧ逾櫁ｩｱ" }
        ];
      }
    } else if (KIND === "puzzle") {
      state.puzzle.pieces = [
        { name: "Tri small", cells: 3, weight: 4 },
        { name: "Diamond4", cells: 4, weight: 3 },
        { name: "T5", cells: 5, weight: 2 },
        { name: "Skew5", cells: 5, weight: 2 }
      ];
      state.puzzle.curve = [1, 1, 2, 2, 3, 3, 4, 5];
      state.puzzle.notes = ["60ﾂｰ rotate feels fair at speed竕､3", "5-cell pieces should stay rare", "Clear row 竊・cascade gravity"];
    } else if (KIND === "rhythm") {
      state.rhythm.charts = [
        { title: "Hill lights", bpm: 118, lanes: 4, density: 4 },
        { title: "City pulse", bpm: 132, lanes: 4, density: 7 }
      ];
      state.rhythm.stages = [
        { name: "Forest approach", mood: "warm pads, soft hits" },
        { name: "Neon ridge", mood: "bright lead, dense taps" }
      ];
    } else if (KIND === "party") {
      state.party.roles = [
        { name: "Werewolf", count: 2 },
        { name: "Seer", count: 1 },
        { name: "Villager", count: 5 },
        { name: "Madmate", count: 1 }
      ];
      state.party.script = [
        "Night falls. Everyone close your eyes.",
        "Werewolves, open your eyes. Choose a target.",
        "Seer, open your eyes. Point to one player.",
        "Everyone, open your eyes. Day discussion begins."
      ];
      state.party.words = [
        { majority: "繧ｳ繝ｼ繝偵・", minority: "繧ｫ繝輔ぉ繝ｩ繝・ },
        { majority: "髮ｻ霆・, minority: "譁ｰ蟷ｹ邱・ }
      ];
    } else if (KIND === "card") {
      state.card.cards = [
        { name: "譯懷ｭ・, rarity: "SSR", atk: 2400 },
        { name: "豬ｷ譁・, rarity: "SR", atk: 1800 },
        { name: "邨占｡｣", rarity: "R", atk: 1100 },
        { name: "闢ｮ", rarity: "N", atk: 700 }
      ];
      state.card.sets = ["Starter Bloom", "Arcade Cabinet", "Valentine Soft"];
    } else if (KIND === "match") {
      state.match.profiles = [
        { name: "Hina", bio: "Quiet cafﾃｩs and night trains", vibe: 78 },
        { name: "Ren", bio: "Gym mornings, vinyl nights", vibe: 64 }
      ];
      state.match.tags = ["night owl", "cafﾃｩ", "travel", "music", "soft"];
      state.match.copy = ["逶ｸ諤ｧ82% 窶・蜷後§豐磯ｻ吶′蠢・慍繧医＞莠御ｺｺ", "Tonight feels like a good match."];
    } else if (KIND === "cook") {
      state.cook.recipes = [
        { name: "蜻ｳ蝎後Λ繝ｼ繝｡繝ｳ", stars: 3, steps: "1. Broth 2. Noodles 3. Toppings" },
        { name: "繧ｪ繝繝ｩ繧､繧ｹ", stars: 4, steps: "1. Rice 2. Egg veil 3. Demi" }
      ];
      state.cook.ingredients = ["蜻ｳ蝎・, "鮗ｺ", "蜊ｵ", "邀ｳ", "鮓剰ｉ", "繝舌ち繝ｼ"];
    } else if (KIND === "fashion") {
      state.fashion.looks = [
        { name: "Midnight trench", style: "formal" },
        { name: "Pastel skate", style: "street" }
      ];
      state.fashion.drops = [
        { name: "Spring atelier", season: "SS" },
        { name: "Neon autumn", season: "AW" }
      ];
      state.fashion.palette = ["#1a1424", "#a594ff", "#f2ebe0", "#5fd4b3"];
    } else if (KIND === "board") {
      state.board.titles = [
        { id: "ISLEBOUND", blurb: "髢区挙 ﾂｷ 雉・ｺ・ﾂｷ 繝倥ャ繧ｯ繧ｹ" },
        { id: "GLINT BAZAAR", blurb: "螳晉浹 ﾂｷ 繧ｨ繝ｳ繧ｸ繝ｳ讒狗ｯ・ },
        { id: "RAILSPAN", blurb: "霍ｯ邱・ﾂｷ 逶ｮ逧・慍" },
        { id: "MOSAIC COURT", blurb: "繧ｿ繧､繝ｫ ﾂｷ 繝峨Λ繝輔ヨ" },
        { id: "CROWNSTACK", blurb: "繝・ャ繧ｭ讒狗ｯ・ }
      ];
      state.board.tweaks = [
        "ISLEBOUND: delay 3rd settle by 1 turn",
        "GLINT: cap gem engine at 2 buys/round",
        "RAILSPAN: bonus for long continuous route"
      ];
    } else if (KIND === "travel") {
      state.travel.routes = [
        { name: "Kyoto night walk", days: 2, stops: "Fushimi 竊・Gion 竊・Arashiyama" }
      ];
      state.travel.gifts = ["謇区嶌縺榊慍蝗ｳ繧呈ｸ｡縺呎ｼ泌・", "鬧・ｼ√ｒ驕ｸ縺ｶ繝溘ル繧ｲ繝ｼ繝", "蜀咏悄繧偵い繝ｫ繝舌Β縺ｫ蜿弱ａ繧・];
      state.travel.quests = ["貂ｯ縺ｧ繝√こ繝・ヨ繧貞・謇九☆繧・, "髴ｧ縺ｮ蟲繧定ｶ翫∴繧・, "雍医ｋ逶ｸ謇九・螂ｽ縺ｿ繧定◇縺榊・縺・];
    }
    document.getElementById("btn-primary").disabled = false;
    VQKit.activity.push(${JSON.stringify(app.brand)}, "Seed/AI from games");
    save();
    VQ.toast("Ready");
  }

  document.getElementById("btn-primary").onclick = runAI;
  document.getElementById("btn-seed").onclick = runAI;
  render();
  VQKit.bindExportButton("Export " + ${JSON.stringify(app.brand)}, ${JSON.stringify(app.brand.toLowerCase() + ".json")}, () => state);
})();
`;
}

function featuresJs(app) {
  return `"use strict";
(async function () {
  if (!window.VQKit) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "app-kit.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const KEY = ${JSON.stringify(app.key + "_pro")};
  const state = VQ.load(KEY, { links: [], checks: [] });
  function paint() {
    if (!document.getElementById("gx-pro")) {
      const el = document.createElement("section");
      el.id = "gx-pro";
      el.className = "card pro-panel";
      el.innerHTML = \`
        <h2>Game link desk</h2>
        <p class="mini" style="margin-top:-6px">Source: ${app.based.replace(/`/g, "")}</p>
        <div class="kpi-row">
          <div class="card"><div class="stat"><span>Links</span><strong id="gx1">0</strong></div></div>
          <div class="card"><div class="stat"><span>Checks</span><strong id="gx2">0</strong></div></div>
          <div class="card"><div class="stat"><span>Based on</span><strong style="font-size:.95rem">game</strong></div></div>
          <div class="card"><div class="stat"><span>Relixia files</span><strong style="font-size:.95rem">safe</strong></div></div>
        </div>
        <div class="toolbar">
          <button type="button" id="gx-link">Pin source path</button>
          <button type="button" id="gx-check">Playtest checklist+</button>
        </div>
        <div class="grid grid-2">
          <div><h3>Pinned</h3><ul class="list" id="gx-links"></ul></div>
          <div><h3>Checklist</h3><ul class="list" id="gx-checks"></ul></div>
        </div>\`;
      document.querySelector(".main").appendChild(el);
      document.getElementById("gx-link").onclick = () => {
        state.links.unshift({ at: Date.now(), path: ${JSON.stringify(app.based)} });
        VQ.store(KEY, state); paint(); VQ.toast("Pinned");
      };
      document.getElementById("gx-check").onclick = () => {
        state.checks.unshift({ at: Date.now(), text: "Verify loop fun in 3 minutes" });
        state.checks.unshift({ at: Date.now(), text: "Export data for designers" });
        VQ.store(KEY, state); paint();
      };
    }
    document.getElementById("gx1").textContent = state.links.length;
    document.getElementById("gx2").textContent = state.checks.length;
    document.getElementById("gx-links").innerHTML = state.links.map((l) =>
      '<li><div>' + VQKit.escape(l.path) + '</div><span class="badge">' + VQKit.relativeTime(l.at) + '</span></li>'
    ).join("") || "<div class='empty'>Pin source game path</div>";
    document.getElementById("gx-checks").innerHTML = state.checks.map((c) =>
      '<li><div>' + VQKit.escape(c.text) + '</div></li>'
    ).join("") || "<div class='empty'>Add checklist</div>";
  }
  paint();
})();
`;
}

for (const app of APPS) {
  const dest = path.join(ROOT, app.dir);
  fs.mkdirSync(path.join(dest, "src"), { recursive: true });
  copyLibs(dest);
  fs.writeFileSync(path.join(dest, "index.html"), indexHtml(app));
  fs.writeFileSync(path.join(dest, "strings.js"), stringsJs(app));
  fs.writeFileSync(path.join(dest, "app.js"), appJs(app));
  fs.writeFileSync(path.join(dest, "features.js"), featuresJs(app));
  fs.writeFileSync(
    path.join(dest, "product.json"),
    JSON.stringify({ id: app.dir, brand: app.brand, basedOn: app.based, standalone: true, version: "1.0.0" }, null, 2)
  );
  fs.writeFileSync(path.join(dest, "src", ".gitkeep"), "");
  console.log("created", app.dir, "竊・, app.based);
}
console.log("done", APPS.length);

