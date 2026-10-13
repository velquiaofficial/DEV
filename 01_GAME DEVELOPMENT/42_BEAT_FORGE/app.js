"use strict";
(function () {
  const KEY = "vq_beatforge_v1";
  const KIND = "rhythm";
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
      ["JP myth", rows.filter((r) => /日本|myth|JP/i.test(r.civ)).length],
      ["Ready", rows.length ? "yes" : "-"]
    ]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Add character</h2>
          <label>ID</label><input id="cb-id" placeholder="001_amaterasu">
          <label>Name</label><input id="cb-name" placeholder="天照">
          <label>Civilization</label><input id="cb-civ" placeholder="日本神話">
          <div class="actions"><button class="primary" id="cb-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Roster</h2><ul class="list" id="cb-list"></ul></div>
      </div>`;
    host("civ").innerHTML = '<div class="card"><h2>By civilization</h2><div id="cb-bars"></div><div id="cb-donut" style="margin-top:12px"></div></div>';
    host("export").innerHTML = '<div class="card"><h2>CSV / notes</h2><pre class="preview" id="cb-out"></pre><div class="actions"><button id="cb-csv" type="button">Download CSV</button></div></div>';
    document.getElementById("cb-list").innerHTML = rows.map((r, i) =>
      '<li><div><strong>' + VQKit.escape(r.name) + '</strong><br><span class="muted">' + VQKit.escape(r.id) + ' · ' + VQKit.escape(r.civ) + '</span></div><button data-x="' + i + '">Del</button></li>'
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
    document.getElementById("cb-out").textContent = "no,character_id,character_name,civilization\n" + rows.map((r, i) =>
      String(i + 1).padStart(3, "0") + "," + r.id + ',"' + r.name + '","' + r.civ + '"'
    ).join("\n");
    document.getElementById("cb-csv").onclick = () => VQKit.downloadCSV("castbible.csv", rows, [
      { label: "character_id", key: "id" }, { label: "character_name", key: "name" }, { label: "civilization", key: "civ" }
    ]);
  }

  function renderPuzzle() {
    const p = state.puzzle;
    host("pieces").innerHTML = kpi([["Pieces", p.pieces.length], ["Avg weight", p.pieces.length ? VQKit.avg(p.pieces.map((x) => x.weight)).toFixed(1) : "-"], ["Hard", p.pieces.filter((x) => x.weight >= 4).length], ["Notes", p.notes.length]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Polyiamond piece</h2>
          <label>Name</label><input id="pz-name" placeholder="T5 skew">
          <label>Cells (3–5)</label><input id="pz-cells" type="number" value="4">
          <label>Spawn weight</label><input id="pz-w" type="number" value="3">
          <div class="actions"><button class="primary" id="pz-add" type="button">Add piece</button></div>
        </div>
        <div class="card"><h2>Set</h2><ul class="list" id="pz-list"></ul></div>
      </div>`;
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
    host("chart").innerHTML = kpi([["Charts", r.charts.length], ["Stages", r.stages.length], ["Avg BPM", r.charts.length ? Math.round(VQKit.avg(r.charts.map((c) => c.bpm))) : "-"], ["Density", r.charts[0] ? r.charts[0].density : "-"]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>New chart</h2>
          <label>Title</label><input id="rh-title" placeholder="Night hills">
          <label>BPM</label><input id="rh-bpm" type="number" value="128">
          <label>Lanes</label><input id="rh-lanes" type="number" value="4">
          <label>Density 1–10</label><input id="rh-den" type="number" value="5">
          <div class="actions"><button class="primary" id="rh-add" type="button">Add chart</button></div>
        </div>
        <div class="card"><h2>Charts</h2><ul class="list" id="rh-list"></ul></div>
      </div>`;
    host("stages").innerHTML = '<div class="card"><h2>Stage moods (Rythom-like)</h2><ul class="list" id="rh-stages"></ul></div>';
    host("export").innerHTML = '<div class="card"><h2>Chart JSON</h2><pre class="preview" id="rh-out"></pre></div>';
    document.getElementById("rh-list").innerHTML = r.charts.map((c) => '<li><div><strong>' + VQKit.escape(c.title) + '</strong><br><span class="muted">' + c.bpm + ' BPM · ' + c.lanes + ' lanes</span></div><span class="badge">d' + c.density + '</span></li>').join("") || "<div class='empty'>Seed Rythom charts</div>";
    document.getElementById("rh-add").onclick = () => {
      r.charts.unshift({ title: document.getElementById("rh-title").value || "Chart", bpm: +document.getElementById("rh-bpm").value || 120, lanes: +document.getElementById("rh-lanes").value || 4, density: +document.getElementById("rh-den").value || 5 });
      save();
    };
    document.getElementById("rh-stages").innerHTML = r.stages.map((s) => '<li><div><strong>' + VQKit.escape(s.name) + '</strong><br><span class="muted">' + VQKit.escape(s.mood) + '</span></div></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("rh-out").textContent = JSON.stringify(r.charts, null, 2);
  }

  function renderParty() {
    const p = state.party;
    host("roles").innerHTML = kpi([["Roles", p.roles.length], ["Script lines", p.script.length], ["Words", p.words.length], ["Players", p.roles.reduce((a, r) => a + (r.count || 0), 0)]]) + `
      <div class="card">
        <h2>Role table (Jinro-style)</h2>
        <div class="toolbar">
          <input id="pt-role" placeholder="Werewolf" style="max-width:160px;margin:0">
          <input id="pt-n" type="number" value="2" style="max-width:80px;margin:0">
          <button class="primary" id="pt-add" type="button">Add role</button>
        </div>
        <ul class="list" id="pt-roles"></ul>
      </div>`;
    host("script").innerHTML = '<div class="card"><h2>Night phase script</h2><ul class="list" id="pt-script"></ul></div>';
    host("words").innerHTML = '<div class="card"><h2>Word Wolf pack</h2><ul class="list" id="pt-words"></ul></div>';
    document.getElementById("pt-roles").innerHTML = p.roles.map((r) => '<li><div><strong>' + VQKit.escape(r.name) + '</strong></div><span class="badge">×' + r.count + '</span></li>').join("") || "<div class='empty'>Seed party roles</div>";
    document.getElementById("pt-add").onclick = () => {
      p.roles.push({ name: document.getElementById("pt-role").value || "Villager", count: +document.getElementById("pt-n").value || 1 });
      save();
    };
    document.getElementById("pt-script").innerHTML = p.script.map((l, i) => '<li><div>' + VQKit.escape(l) + '</div><span class="badge">N' + (i + 1) + '</span></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("pt-words").innerHTML = p.words.map((w) => '<li><div><strong>' + VQKit.escape(w.majority) + '</strong> vs <strong>' + VQKit.escape(w.minority) + '</strong></div></li>').join("") || "<div class='empty'>Run AI</div>";
  }

  function renderCard() {
    const c = state.card;
    host("cards").innerHTML = kpi([["Cards", c.cards.length], ["Sets", c.sets.length], ["SSR", c.cards.filter((x) => x.rarity === "SSR").length], ["Avg ATK", c.cards.length ? Math.round(VQKit.avg(c.cards.map((x) => x.atk))) : "-"]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Musuking-style card</h2>
          <label>Name</label><input id="dk-name" placeholder="桜子">
          <label>Rarity</label><select id="dk-r"><option>N</option><option>R</option><option>SR</option><option>SSR</option></select>
          <label>ATK</label><input id="dk-atk" type="number" value="1200">
          <div class="actions"><button class="primary" id="dk-add" type="button">Add card</button></div>
        </div>
        <div class="card"><h2>Card list</h2><ul class="list" id="dk-list"></ul></div>
      </div>`;
    host("sets").innerHTML = '<div class="card"><h2>Sets</h2><ul class="list" id="dk-sets"></ul></div>';
    host("balance").innerHTML = '<div class="card"><h2>Rarity mix</h2><div id="dk-bars"></div><div id="dk-donut"></div></div>';
    document.getElementById("dk-list").innerHTML = c.cards.map((x) => '<li><div><strong>' + VQKit.escape(x.name) + '</strong></div><span class="badge">' + x.rarity + ' · ' + x.atk + '</span></li>').join("") || "<div class='empty'>Seed Musuking cards</div>";
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
    host("profiles").innerHTML = kpi([["Profiles", m.profiles.length], ["Tags", m.tags.length], ["Copy", m.copy.length], ["Avg vibe", m.profiles.length ? Math.round(VQKit.avg(m.profiles.map((p) => p.vibe))) : "-"]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Profile</h2>
          <label>Name</label><input id="sm-name" placeholder="Hina">
          <label>Bio</label><textarea id="sm-bio" placeholder="Loves late trains and quiet cafés"></textarea>
          <label>Vibe 1–100</label><input id="sm-vibe" type="number" value="72">
          <div class="actions"><button class="primary" id="sm-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Profiles</h2><ul class="list" id="sm-list"></ul></div>
      </div>`;
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
    host("recipes").innerHTML = kpi([["Recipes", c.recipes.length], ["Ingredients", c.ingredients.length], ["Avg stars", c.recipes.length ? VQKit.avg(c.recipes.map((r) => r.stars)).toFixed(1) : "-"], ["Hard", c.recipes.filter((r) => r.stars >= 4).length]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Recipe</h2>
          <label>Name</label><input id="cq-name" placeholder="味噌ラーメン">
          <label>Stars 1–5</label><input id="cq-stars" type="number" value="3">
          <label>Steps</label><textarea id="cq-steps" placeholder="1. Boil…"></textarea>
          <div class="actions"><button class="primary" id="cq-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Book</h2><ul class="list" id="cq-list"></ul></div>
      </div>`;
    host("graph").innerHTML = '<div class="card"><h2>Ingredient graph</h2><div id="cq-bars"></div></div>';
    host("stars").innerHTML = '<div class="card"><h2>Star histogram</h2><div id="cq-hist"></div></div>';
    document.getElementById("cq-list").innerHTML = c.recipes.map((r) => '<li><div><strong>' + VQKit.escape(r.name) + '</strong><br><span class="muted">' + VQKit.escape((r.steps || "").slice(0, 80)) + '</span></div><span class="badge">' + "★".repeat(r.stars) + '</span></li>').join("") || "<div class='empty'>Seed cooking recipes</div>";
    document.getElementById("cq-add").onclick = () => {
      c.recipes.unshift({ name: document.getElementById("cq-name").value || "Dish", stars: +document.getElementById("cq-stars").value || 1, steps: document.getElementById("cq-steps").value || "" });
      save();
    };
    document.getElementById("cq-bars").innerHTML = VQKit.barChart(VQKit.groupCount(c.ingredients, (x) => x));
    document.getElementById("cq-hist").innerHTML = VQKit.histogram(c.recipes.map((r) => r.stars), 5);
  }

  function renderFashion() {
    const f = state.fashion;
    host("looks").innerHTML = kpi([["Looks", f.looks.length], ["Drops", f.drops.length], ["Palette", f.palette.length], ["Seasons", new Set(f.drops.map((d) => d.season)).size]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Look</h2>
          <label>Name</label><input id="ad-name" placeholder="Midnight trench">
          <label>Style</label><select id="ad-style"><option>street</option><option>formal</option><option>soft</option><option>avant</option></select>
          <div class="actions"><button class="primary" id="ad-add" type="button">Add look</button></div>
        </div>
        <div class="card"><h2>Looks</h2><ul class="list" id="ad-list"></ul></div>
      </div>`;
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
    host("sessions").innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <h2>Log session</h2>
          <label>Title</label><select id="tf-t"></select>
          <label>Score 1–5</label><input id="tf-s" type="number" value="4">
          <label>Note</label><textarea id="tf-n" placeholder="Resource snowball too strong…"></textarea>
          <div class="actions"><button class="primary" id="tf-add" type="button">Log</button></div>
        </div>
        <div class="card"><h2>Sessions</h2><ul class="list" id="tf-sess"></ul></div>
      </div>`;
    host("balance").innerHTML = '<div class="card"><h2>Balance queue</h2><ul class="list" id="tf-tw"></ul><div id="tf-bars" style="margin-top:12px"></div></div>';
    document.getElementById("tf-titles").innerHTML = b.titles.map((t) => '<li><div><strong>' + VQKit.escape(t.id) + '</strong><br><span class="muted">' + VQKit.escape(t.blurb) + '</span></div></li>').join("") || "<div class='empty'>Seed boardgames</div>";
    const sel = document.getElementById("tf-t");
    sel.innerHTML = b.titles.map((t) => '<option>' + VQKit.escape(t.id) + '</option>').join("") || "<option>ISLEBOUND</option>";
    document.getElementById("tf-sess").innerHTML = b.sessions.map((s) => '<li><div><strong>' + VQKit.escape(s.title) + '</strong><br><span class="muted">' + VQKit.escape(s.note) + '</span></div><span class="badge">' + s.score + '★</span></li>').join("") || "<div class='empty'>No sessions</div>";
    document.getElementById("tf-add").onclick = () => {
      b.sessions.unshift({ title: sel.value, score: +document.getElementById("tf-s").value || 3, note: document.getElementById("tf-n").value || "", at: Date.now() });
      save();
    };
    document.getElementById("tf-tw").innerHTML = b.tweaks.map((t) => '<li><div>' + VQKit.escape(t) + '</div></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("tf-bars").innerHTML = VQKit.barChart(VQKit.groupCount(b.sessions, (s) => s.title));
  }

  function renderTravel() {
    const t = state.travel;
    host("routes").innerHTML = kpi([["Routes", t.routes.length], ["Gifts", t.gifts.length], ["Quests", t.quests.length], ["Days", t.routes.reduce((a, r) => a + (r.days || 0), 0)]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Travel route</h2>
          <label>Name</label><input id="wf-name" placeholder="Kyoto night walk">
          <label>Days</label><input id="wf-days" type="number" value="2">
          <label>Stops</label><textarea id="wf-stops" placeholder="Fushimi → Gion → Arashiyama"></textarea>
          <div class="actions"><button class="primary" id="wf-add" type="button">Add route</button></div>
        </div>
        <div class="card"><h2>Routes</h2><ul class="list" id="wf-routes"></ul></div>
      </div>`;
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
          { id: "001_amaterasu", name: "天照", civ: "日本神話" },
          { id: "002_tsukuyomi", name: "月読", civ: "日本神話" },
          { id: "003_susanoo", name: "須佐之男", civ: "日本神話" },
          { id: "010_odin", name: "Odin", civ: "北欧神話" },
          { id: "011_freya", name: "Freya", civ: "北欧神話" }
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
      state.puzzle.notes = ["60° rotate feels fair at speed≤3", "5-cell pieces should stay rare", "Clear row → cascade gravity"];
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
        { majority: "コーヒー", minority: "カフェラテ" },
        { majority: "電車", minority: "新幹線" }
      ];
    } else if (KIND === "card") {
      state.card.cards = [
        { name: "桜子", rarity: "SSR", atk: 2400 },
        { name: "海斗", rarity: "SR", atk: 1800 },
        { name: "結衣", rarity: "R", atk: 1100 },
        { name: "蓮", rarity: "N", atk: 700 }
      ];
      state.card.sets = ["Starter Bloom", "Arcade Cabinet", "Valentine Soft"];
    } else if (KIND === "match") {
      state.match.profiles = [
        { name: "Hina", bio: "Quiet cafés and night trains", vibe: 78 },
        { name: "Ren", bio: "Gym mornings, vinyl nights", vibe: 64 }
      ];
      state.match.tags = ["night owl", "café", "travel", "music", "soft"];
      state.match.copy = ["相性82% — 同じ沈黙が心地よい二人", "Tonight feels like a good match."];
    } else if (KIND === "cook") {
      state.cook.recipes = [
        { name: "味噌ラーメン", stars: 3, steps: "1. Broth 2. Noodles 3. Toppings" },
        { name: "オムライス", stars: 4, steps: "1. Rice 2. Egg veil 3. Demi" }
      ];
      state.cook.ingredients = ["味噌", "麺", "卵", "米", "鶏肉", "バター"];
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
        { id: "ISLEBOUND", blurb: "開拓 · 資源 · ヘックス" },
        { id: "GLINT BAZAAR", blurb: "宝石 · エンジン構築" },
        { id: "RAILSPAN", blurb: "路線 · 目的地" },
        { id: "MOSAIC COURT", blurb: "タイル · ドラフト" },
        { id: "CROWNSTACK", blurb: "デッキ構築" }
      ];
      state.board.tweaks = [
        "ISLEBOUND: delay 3rd settle by 1 turn",
        "GLINT: cap gem engine at 2 buys/round",
        "RAILSPAN: bonus for long continuous route"
      ];
    } else if (KIND === "travel") {
      state.travel.routes = [
        { name: "Kyoto night walk", days: 2, stops: "Fushimi → Gion → Arashiyama" }
      ];
      state.travel.gifts = ["手書き地図を渡す演出", "駅弁を選ぶミニゲーム", "写真をアルバムに収める"];
      state.travel.quests = ["港でチケットを入手する", "霧の峠を越える", "贈る相手の好みを聞き出す"];
    }
    document.getElementById("btn-primary").disabled = false;
    VQKit.activity.push("BeatForge", "Seed/AI from games");
    save();
    VQ.toast("Ready");
  }

  document.getElementById("btn-primary").onclick = runAI;
  document.getElementById("btn-seed").onclick = runAI;
  render();
  VQKit.bindExportButton("Export " + "BeatForge", "beatforge.json", () => state);
})();
