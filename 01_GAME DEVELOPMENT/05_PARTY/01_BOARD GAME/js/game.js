(function () {
  const DATA = window.HAAN_DATA;
  const scoreApi = window.HaaScore;
  const app = document.getElementById("app");
  if (!DATA || !scoreApi || !app) {
    if (app) app.textContent = "読み込みに失敗しました。ページを開き直してください。";
    return;
  }

  const LETTERS = DATA.LETTERS;
  const KEY = "haa-ondo-v1";
  const COLORS = ["#ef9f55", "#e7a0b4", "#7eafc4", "#b7c48a", "#d7c07a", "#c49a84", "#a99ae0", "#8fbfb0"];
  let lockUntil = 0;
  let audioCtx = null;

  const state = {
    phase: "title",
    sound: true,
    unlocked: [],
    savedNames: [],
    roster: [{ name: "" }, { name: "" }, { name: "" }],
    mode: "mix",
    roundsTotal: 1,
    remember: true,
    setupError: "",
    modal: null,
    players: [],
    roundIndex: 0,
    used: {},
    promptBag: [],
    prompt: null,
    situations: [],
    assignments: [],
    dealIndex: 0,
    actorCursor: 0,
    voterList: [],
    voterStep: 0,
    votes: [],
    settled: {},
    scoreAtRoundStart: [],
    passKind: "deal",
    peeking: false,
    draft: { situation: null, temp: null, beat: null },
    currentReveal: null,
    copied: false,
    copyError: "",
  };

  function loadStore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { names: [], prompts: [], sound: true };
      const data = JSON.parse(raw);
      return {
        names: Array.isArray(data.names) ? data.names : [],
        prompts: Array.isArray(data.prompts) ? data.prompts : [],
        sound: data.sound !== false,
      };
    } catch (err) {
      return { names: [], prompts: [], sound: true };
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        names: state.savedNames,
        prompts: state.unlocked,
        sound: state.sound,
      }));
    } catch (err) {
      /* private mode */
    }
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function cleanName(value) {
    return String(value || "").replace(/[\r\n\t]/g, "").trim().slice(0, 8);
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function tempById(id) {
    return DATA.TEMPS.find(function (temp) { return temp.id === id; });
  }

  function beatById(id) {
    return DATA.BEATS.find(function (beat) { return beat.id === id; });
  }

  function others(actorIndex) {
    const list = [];
    for (let step = 1; step < state.players.length; step += 1) {
      list.push((actorIndex + step) % state.players.length);
    }
    return list;
  }

  function promptPool() {
    if (state.mode === "haa") {
      return DATA.PROMPTS.filter(function (prompt) { return prompt.id === "haa"; });
    }
    return DATA.PROMPTS;
  }

  function drawPrompt() {
    const pool = promptPool();
    const ids = pool.map(function (prompt) { return prompt.id; });
    state.promptBag = state.promptBag.filter(function (id) { return ids.indexOf(id) !== -1; });
    if (!state.promptBag.length) state.promptBag = shuffle(ids);
    const id = state.promptBag.pop();
    return DATA.PROMPTS.find(function (prompt) { return prompt.id === id; });
  }

  function pickSituations(prompt, count) {
    const used = state.used[prompt.id] || [];
    let pool = prompt.situations.filter(function (text) { return used.indexOf(text) === -1; });
    const reused = pool.length < count;
    if (reused) pool = prompt.situations.slice();
    const picked = shuffle(pool).slice(0, count);
    state.used[prompt.id] = reused ? picked.slice() : used.concat(picked);
    return picked;
  }

  function dealTemps(count) {
    const ids = DATA.TEMPS.map(function (temp) { return temp.id; });
    const out = [];
    while (out.length < count) out.push.apply(out, shuffle(ids));
    return out.slice(0, count);
  }

  function dealBeats(count) {
    const ids = DATA.BEATS.map(function (beat) { return beat.id; });
    const out = [];
    while (out.length < count) out.push.apply(out, shuffle(ids));
    return out.slice(0, count);
  }

  function soundBtn() {
    const label = state.sound ? "音オン" : "音オフ";
    return '<button type="button" class="text-btn" data-action="toggle-sound" aria-pressed="' + state.sound + '">' + label + "</button>";
  }

  function topbar(options) {
    const quit = options && options.quit
      ? '<button type="button" class="text-btn" data-action="ask-quit">やめる</button>'
      : "";
    return '<header class="topbar"><p class="brand">はぁの温度</p><div class="top-actions">' + soundBtn() + quit + "</div></header>";
  }

  function frame(body) {
    return body + (state.modal ? viewModal() : "");
  }

  function ctx() {
    if (!state.sound) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function blip(kind) {
    const context = ctx();
    if (!context) return;
    const now = context.currentTime;
    const notes = kind === "good" ? [587, 880] : [523, 659, 784];
    notes.forEach(function (freq, index) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + index * 0.07;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.04, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  function buzz() {
    try {
      if (navigator.vibrate) navigator.vibrate([12, 40, 12]);
    } catch (err) {
      /* ignore */
    }
  }

  function unlockPrompt(id) {
    if (state.unlocked.indexOf(id) !== -1) return;
    state.unlocked.push(id);
    persist();
  }

  function startGame(names, remember) {
    state.remember = remember !== false;
    state.players = names.map(function (name, index) {
      return {
        name: name,
        color: COLORS[index],
        score: 0,
        sceneHits: 0,
        bothHits: 0,
        beatHits: 0,
        actorPts: 0,
      };
    });
    state.roundIndex = 0;
    state.used = {};
    state.promptBag = [];
    state.modal = null;
    state.setupError = "";
    if (state.remember) {
      state.savedNames = names.slice();
      state.roster = names.map(function (name) { return { name: name }; });
      persist();
    }
    beginRound();
  }

  function beginRound() {
    const count = state.players.length;
    const prompt = drawPrompt();
    const situations = pickSituations(prompt, count);
    const temps = dealTemps(count);
    const beats = dealBeats(count);
    const order = shuffle(situations.map(function (_, index) { return index; }));
    state.prompt = prompt;
    state.situations = situations;
    state.assignments = order.map(function (situationIndex, playerIndex) {
      return {
        situationIndex: situationIndex,
        tempId: temps[playerIndex],
        beatId: beats[playerIndex],
      };
    });
    state.votes = state.players.map(function () { return {}; });
    state.settled = {};
    state.actorCursor = 0;
    state.scoreAtRoundStart = state.players.map(function (player) { return player.score; });
    state.peeking = false;
    state.phase = "intro";
    render();
  }

  function openDealPass() {
    state.passKind = "deal";
    state.peeking = false;
    state.phase = "pass";
    render();
  }

  function openVotePass() {
    state.passKind = "vote";
    state.phase = "pass";
    render();
  }

  function advancePass() {
    if (state.passKind === "deal") {
      state.peeking = false;
      state.phase = "secret";
      render();
      return;
    }
    if (state.passKind === "peek") {
      state.peeking = true;
      state.phase = "secret";
      render();
      return;
    }
    state.draft = { situation: null, temp: null, beat: null };
    state.phase = "vote";
    render();
  }

  function hideSecret() {
    if (state.peeking) {
      state.peeking = false;
      state.phase = "table";
      render();
      return;
    }
    state.dealIndex += 1;
    if (state.dealIndex < state.players.length) {
      openDealPass();
      return;
    }
    state.phase = "center";
    render();
  }

  function beginVotes() {
    state.voterList = others(state.actorCursor);
    state.voterStep = 0;
    state.votes[state.actorCursor] = {};
    openVotePass();
  }

  function selectSituation(index) {
    state.draft.situation = index;
    app.querySelectorAll("[data-action='pick-situation']").forEach(function (el) {
      const on = Number(el.dataset.index) === index;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const confirm = document.getElementById("confirm-vote");
    if (confirm) confirm.disabled = false;
  }

  function selectTemp(id) {
    state.draft.temp = id === "skip" ? null : id;
    app.querySelectorAll("[data-action='pick-temp']").forEach(function (el) {
      const on = el.dataset.temp === id;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function selectBeat(id) {
    state.draft.beat = id === "skip" ? null : id;
    app.querySelectorAll("[data-action='pick-beat']").forEach(function (el) {
      const on = el.dataset.beat === id;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function confirmVote() {
    if (state.phase !== "vote") return;
    if (state.draft.situation == null) {
      const box = app.querySelector(".choices");
      if (box) {
        box.classList.remove("shake");
        void box.offsetWidth;
        box.classList.add("shake");
      }
      return;
    }
    const actor = state.actorCursor;
    const voter = state.voterList[state.voterStep];
    state.votes[actor][voter] = {
      situationIndex: state.draft.situation,
      tempId: state.draft.temp,
      beatId: state.draft.beat,
    };
    state.voterStep += 1;
    if (state.voterStep < state.voterList.length) {
      openVotePass();
      return;
    }
    revealActor();
  }

  function revealActor() {
    const actorIndex = state.actorCursor;
    if (!state.settled[actorIndex]) {
      const result = scoreApi.settleActor({
        actorIndex: actorIndex,
        assignment: state.assignments[actorIndex],
        votes: state.votes[actorIndex],
        voterIndexes: others(actorIndex),
      });
      Object.keys(result.gain).forEach(function (key) {
        state.players[Number(key)].score += result.gain[key];
      });
      result.detail.forEach(function (row) {
        if (row.sceneOk) state.players[row.playerIndex].sceneHits += 1;
        if (row.tempOk) state.players[row.playerIndex].bothHits += 1;
        if (row.beatOk) state.players[row.playerIndex].beatHits += 1;
      });
      state.players[actorIndex].actorPts += result.actorPts;
      state.currentReveal = {
        actorIndex: actorIndex,
        situationIndex: state.assignments[actorIndex].situationIndex,
        tempId: state.assignments[actorIndex].tempId,
        beatId: state.assignments[actorIndex].beatId,
        actorPts: result.actorPts,
        detail: result.detail,
        gain: result.gain,
        sceneCount: result.sceneCount,
        bothCount: result.bothCount,
        beatCount: result.beatCount,
        voterCount: result.voterCount,
      };
      state.settled[actorIndex] = true;
      unlockPrompt(state.prompt.id);
    }
    state.phase = "reveal";
    const reveal = state.currentReveal;
    blip(reveal.bothCount > 0 || reveal.sceneCount === reveal.voterCount ? "good" : "reveal");
    buzz();
    render();
  }

  function reaction(reveal) {
    if (!reveal.sceneCount) return "届かなくても、息は残る。";
    if (reveal.voterCount && reveal.bothCount === reveal.voterCount) return "温度まで、全部見えた。";
    if (reveal.sceneCount === reveal.voterCount) return "状況は、全員に届いた。";
    return "何人かに、届いた。";
  }

  function nextAfterReveal() {
    const lastActor = state.actorCursor >= state.players.length - 1;
    if (!lastActor) {
      state.actorCursor += 1;
      state.phase = "table";
      render();
      return;
    }
    if (state.roundIndex < state.roundsTotal - 1) {
      state.phase = "mid";
      render();
      return;
    }
    goFinal();
  }

  function goFinal() {
    state.copied = false;
    state.copyError = "";
    state.phase = "final";
    blip("good");
    render();
  }

  function ranking() {
    const rows = state.players.map(function (player, index) {
      return { name: player.name, color: player.color, score: player.score, index: index };
    });
    rows.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    let place = 1;
    return rows.map(function (row, index) {
      if (index > 0 && row.score < rows[index - 1].score) place = index + 1;
      return {
        name: row.name,
        color: row.color,
        score: row.score,
        index: row.index,
        place: place,
      };
    });
  }

  function resultText() {
    const lines = ["はぁの温度"].concat(ranking().map(function (row) {
      return row.place + ". " + row.name + "  " + row.score + "点";
    }));
    return lines.join("\n");
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-999px";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    area.remove();
    return ok;
  }

  function copyResult() {
    const text = resultText();
    const done = function (ok) {
      state.copied = ok;
      state.copyError = ok ? "" : "コピーできませんでした。";
      render();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () {
        done(fallbackCopy(text));
      });
      return;
    }
    done(fallbackCopy(text));
  }

  function goTitle() {
    state.phase = "title";
    state.modal = null;
    render();
  }

  function readRoster() {
    const inputs = Array.prototype.slice.call(app.querySelectorAll("[data-rename]"));
    if (!inputs.length) return state.roster.map(function (player) { return cleanName(player.name); });
    return inputs.map(function (input) { return cleanName(input.value); });
  }

  function startFromSetup() {
    const names = readRoster();
    if (names.length < 2) {
      state.setupError = "2人以上で遊べます。";
      render();
      return;
    }
    if (names.some(function (name) { return !name; })) {
      state.setupError = "空いている名前を入れてください。";
      render();
      return;
    }
    if (new Set(names).size !== names.length) {
      state.setupError = "同じ名前があります。";
      render();
      return;
    }
    startGame(names, true);
  }

  function passPlayer() {
    if (state.passKind === "vote") return state.players[state.voterList[state.voterStep]];
    if (state.passKind === "peek") return state.players[state.actorCursor];
    return state.players[state.dealIndex];
  }

  function secretIndex() {
    return state.peeking ? state.actorCursor : state.dealIndex;
  }

  function hideLabel() {
    if (state.peeking) return "卓に戻す";
    if (state.dealIndex >= state.players.length - 1) return "伏せて、卓に置く";
    return "伏せて、次の人へ";
  }

  function revealNextLabel() {
    if (state.actorCursor < state.players.length - 1) return "つぎの人へ";
    if (state.roundIndex < state.roundsTotal - 1) return "このお題の結果へ";
    return "結果を見る";
  }

  function tempJudge(row) {
    if (!row.pickTemp) return "読まない";
    return row.tempOk ? "当たった" : "はずれ";
  }

  function beatJudge(row) {
    if (!row.pickBeat) return "読まない";
    return row.beatOk ? "当たった" : "はずれ";
  }

  function viewTitle() {
    const count = state.unlocked.length;
    const mark = count ? '<p class="note foot">しるし ' + count + " / " + DATA.PROMPTS.length + "</p>" : "";
    return frame('<section class="screen">' +
      '<header class="topbar"><span></span>' + soundBtn() + "</header>" +
      '<div class="hero"><div class="breath-ring" aria-hidden="true"></div>' +
      '<h1 class="hero-word" data-focus>はぁ<span>の温度</span></h1></div>' +
      '<p class="lead">声と顔だけで、隠れた温度まで。</p>' +
      '<div class="stack start-block">' +
      '<button type="button" class="btn btn-primary" data-action="quick-start">はじめる</button>' +
      '<button type="button" class="btn btn-ghost" data-action="go-setup">人数をきめる</button>' +
      "</div>" +
      '<div class="link-row">' +
      '<button type="button" class="text-btn" data-action="go-how">あそびかた</button>' +
      '<button type="button" class="text-btn" data-action="go-zukan">しるし</button>' +
      "</div>" +
      '<p class="note foot">スマホ1台 · 声と顔だけ</p>' + mark +
      "</section>");
  }

  function viewHow() {
    return frame('<section class="screen">' + topbar() +
      '<p class="kicker">あそびかた</p><h1 data-focus>一言を、渡す</h1>' +
      '<ol class="steps">' +
      "<li><span class=\"num\">1</span><div><h2>札を一緒に見る</h2><p>お題の一言と、状況の一覧は全員に見えます。</p></div></li>" +
      "<li><span class=\"num\">2</span><div><h2>担当だけこっそり</h2><p>自分の状況と、裏の温度と間を見て、すぐ伏せます。</p></div></li>" +
      "<li><span class=\"num\">3</span><div><h2>声と顔だけ</h2><p>手は使いません。言うのはお題の一言だけ。温度は声と目元、間は出すタイミングに隠します。</p></div></li>" +
      "<li><span class=\"num\">4</span><div><h2>状況を選ぶ</h2><p>聞き手は状況を一つ。温度や間まで読めそうなら、それも選びます。読まなくても大丈夫です。</p></div></li>" +
      "<li><span class=\"num\">5</span><div><h2>すぐ開ける</h2><p>ひとり終わるごとに答え合わせ。状況が当たれば1点ずつ。温度か間も当たれば、その分もう1点。</p></div></li>" +
      "</ol>" +
      '<div class="example"><p><strong>たとえば。</strong> お題は「はぁ」。あおいの状況は「探してた鍵が、最初から手の中にあった」、温度は「にがい」。あおいは「はぁ」とだけ言います。間は「一拍」。状況だけなら1点、温度や間も当たればその分増えます。</p></div>' +
      '<p class="note">このゲームはオリジナルです。卓を囲み、スマホを真ん中の札にして遊びます。</p>' +
      '<div class="dock"><button type="button" class="btn btn-primary" data-action="go-title">わかった</button></div></section>');
  }

  function viewSetup() {
    const names = state.roster.map(function (player, index) {
      const remove = state.roster.length > 2
        ? '<button type="button" class="text-btn" data-action="remove-player" data-index="' + index + '">外す</button>'
        : "";
      return '<div class="name-field"><i class="dot" style="background:' + COLORS[index] + '"></i>' +
        '<input data-rename="' + index + '" maxlength="8" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="なまえ" value="' + esc(player.name) + '">' +
        remove + "</div>";
    }).join("");
    const add = state.roster.length < 8
      ? '<button type="button" class="text-btn" data-action="add-player">人を足す</button>'
      : "";
    const modeHaa = state.mode === "haa" ? " is-on" : "";
    const modeMix = state.mode === "mix" ? " is-on" : "";
    const one = state.roundsTotal === 1 ? " is-on" : "";
    const two = state.roundsTotal === 2 ? " is-on" : "";
    const modeNote = state.mode === "haa"
      ? "お題はいつも「はぁ」。状況は毎回変わります。"
      : "はぁ、えっ、ふむ…一言が巡ります。";
    return frame('<section class="screen">' + topbar() +
      '<p class="kicker">メンバー</p><h1 data-focus>誰が息を渡す？</h1>' +
      '<p class="note">渡す順は、上から時計回り。3人からがちょうどいいです。</p>' +
      '<div class="names">' + names + "</div>" + add +
      '<p class="error">' + esc(state.setupError) + "</p>" +
      '<div class="field"><p class="field-label">お題</p><div class="seg">' +
      '<button type="button" class="' + modeHaa.trim() + '" data-action="set-mode" data-value="haa" aria-pressed="' + (state.mode === "haa") + '">はぁだけ</button>' +
      '<button type="button" class="' + modeMix.trim() + '" data-action="set-mode" data-value="mix" aria-pressed="' + (state.mode === "mix") + '">いろいろ</button>' +
      "</div><p class=\"note\">" + modeNote + "</p></div>" +
      '<div class="field"><p class="field-label">回数</p><div class="seg">' +
      '<button type="button" class="' + one.trim() + '" data-action="set-rounds" data-value="1" aria-pressed="' + (state.roundsTotal === 1) + '">1お題</button>' +
      '<button type="button" class="' + two.trim() + '" data-action="set-rounds" data-value="2" aria-pressed="' + (state.roundsTotal === 2) + '">2お題</button>' +
      "</div><p class=\"note\">まずは1お題がおすすめです。</p></div>" +
      '<div class="dock"><button type="button" class="btn btn-primary" data-action="start-game">はじめる</button>' +
      '<button type="button" class="btn btn-ghost" data-action="go-title">戻る</button></div></section>');
  }

  function viewZukan() {
    const seals = DATA.PROMPTS.map(function (prompt) {
      const on = state.unlocked.indexOf(prompt.id) !== -1;
      return '<li class="seal' + (on ? " is-on" : "") + '"><span class="seal-word">' + (on ? esc(prompt.line) : "？") +
        '</span><span class="seal-note">' + (on ? esc(prompt.note) : "まだ出ていない") + "</span></li>";
    }).join("");
    const all = DATA.PROMPTS.every(function (prompt) { return state.unlocked.indexOf(prompt.id) !== -1; });
    const reset = state.unlocked.length
      ? '<button type="button" class="btn btn-ghost" data-action="ask-reset">しるしを消す</button>'
      : "";
    return frame('<section class="screen">' + topbar() +
      '<p class="kicker">しるし</p><h1 data-focus>遊んだ一言</h1>' +
      '<p class="note">遊び終わったお題が、ここに残ります。</p>' +
      (all ? '<p class="lead">六つの一言がそろった。</p>' : "") +
      '<ul class="seals">' + seals + "</ul>" +
      '<div class="dock">' + reset +
      '<button type="button" class="btn btn-primary" data-action="go-title">戻る</button></div></section>');
  }

  function viewIntro() {
    const menu = state.situations.map(function (text, index) {
      return "<li><span class=\"mark\">" + LETTERS[index] + "</span><span>" + esc(text) + "</span></li>";
    }).join("");
    const order = state.players.map(function (player) {
      return "<li>" + esc(player.name) + "</li>";
    }).join("");
    const legend = DATA.TEMPS.map(function (temp) {
      return "<li><span class=\"temp-mark\">" + temp.mark + "</span>" + temp.label + "</li>";
    }).join("") + DATA.BEATS.map(function (beat) {
      return "<li><span class=\"temp-mark\">" + beat.mark + "</span>" + beat.label + "</li>";
    }).join("");
    return frame('<section class="screen">' + topbar({ quit: true }) +
      '<p class="kicker">お題 ' + (state.roundIndex + 1) + " / " + state.roundsTotal + "</p>" +
      '<article class="paper"><h1 class="word" data-focus>' + esc(state.prompt.line) + "</h1>" +
      '<p class="note">' + esc(state.prompt.note) + "</p>" +
      '<ul class="menu">' + menu + "</ul>" +
      '<p class="pill">手は使わない · 一言だけ</p></article>' +
      '<p class="field-label" style="margin-top:16px">演じる順</p><ol class="order">' + order + "</ol>" +
      '<ul class="legend">' + legend + "</ul>" +
      '<p class="note">一覧は全員で見ていい。裏の温度と間は、演者だけの秘密です。</p>' +
      '<div class="dock"><button type="button" class="btn btn-primary" data-action="start-deal">こっそり配る</button></div></section>');
  }

  function viewPass() {
    const player = passPlayer();
    let kicker = "配役 " + (state.dealIndex + 1) + " / " + state.players.length;
    let body = "自分のカードだけを見て、すぐ伏せます。";
    let button = "カードを見る";
    if (state.passKind === "vote") {
      kicker = "投票 " + (state.voterStep + 1) + " / " + state.voterList.length;
      body = esc(state.players[state.actorCursor].name) + "の演技を、自分だけで投票します。";
      button = "投票する";
    } else if (state.passKind === "peek") {
      kicker = "見直し";
      body = "見たあとは、すぐ卓へ戻します。";
      button = "担当を見る";
    }
    return frame('<section class="screen"><div class="topbar"><p class="brand">はぁの温度</p>' + soundBtn() + "</div>" +
      '<div class="center-block"><p class="kicker">' + kicker + "</p>" +
      '<i class="dot" style="background:' + player.color + '"></i>' +
      '<h1 class="pass-title" data-focus>' + esc(player.name) + "</h1>" +
      '<p class="lead">' + body + "</p>" +
      '<button type="button" class="btn btn-primary" data-action="advance-pass">' + button + "</button></div></section>");
  }

  function viewSecret() {
    const index = secretIndex();
    const player = state.players[index];
    const assignment = state.assignments[index];
    const temp = tempById(assignment.tempId);
    const beat = beatById(assignment.beatId);
    const situation = state.situations[assignment.situationIndex];
    return frame('<section class="screen">' + topbar({ quit: true }) +
      '<p class="privacy">まわりに見えないように</p>' +
      '<article class="secret" style="background:' + temp.wash + ";color:" + temp.ink + '">' +
      '<p class="stamp">ないしょ</p>' +
      '<p class="who">' + esc(player.name) + "</p>" +
      '<p class="kicker">お題</p><p class="prompt-sm">' + esc(state.prompt.line) + "</p>" +
      '<p class="kicker">状況 ' + LETTERS[assignment.situationIndex] + "</p>" +
      '<h1 data-focus>' + esc(situation) + "</h1>" +
      '<p class="kicker">裏の温度</p><p class="temp-lg">' + temp.mark + " " + temp.label + "</p>" +
      '<p class="hint">' + esc(temp.hint) + "</p>" +
      '<p class="kicker">間</p><p class="temp-lg">' + beat.mark + " " + beat.label + "</p>" +
      '<p class="hint">' + esc(beat.hint) + "</p>" +
      '<p class="hint">声と顔だけ。手は使わない。<br>言うのは「' + esc(state.prompt.line) + "」だけ。</p></article>" +
      '<div class="dock"><button type="button" class="btn btn-primary" data-action="hide-secret">' + hideLabel() + "</button></div></section>");
  }

  function viewCenter() {
    const name = state.players[0].name;
    return frame('<section class="screen">' + topbar({ quit: true }) +
      '<div class="center-block"><p class="kicker">卓へ</p>' +
      '<h1 class="pass-title" data-focus>真ん中に置く</h1>' +
      '<p class="lead">このあとの札は、全員で見ていいです。最初に演じるのは、' + esc(name) + "。手は使わず、声と顔だけで。</p>" +
      '<button type="button" class="btn btn-primary" data-action="to-table">札を開く</button></div></section>');
  }

  function viewTable() {
    const actor = state.actorCursor;
    const player = state.players[actor];
    const menu = state.situations.map(function (text, index) {
      return "<li><span class=\"mark\">" + LETTERS[index] + "</span><span>" + esc(text) + "</span></li>";
    }).join("");
    const turns = state.players.map(function (person, index) {
      const cls = index === actor ? "is-now" : index < actor ? "is-done" : "";
      return '<li class="' + cls + '">' + esc(person.name) + "</li>";
    }).join("");
    return frame('<section class="screen">' + topbar({ quit: true }) +
      '<p class="kicker">お題 ' + (state.roundIndex + 1) + " / " + state.roundsTotal + "</p>" +
      '<article class="paper"><h1 class="word" data-focus>' + esc(state.prompt.line) +
      '<span class="now">' + esc(player.name) + "の番 · " + (actor + 1) + " / " + state.players.length + "</span></h1>" +
      '<ul class="menu">' + menu + "</ul>" +
      '<ol class="turn">' + turns + "</ol>" +
      '<p class="pill">手は使わない · 一言だけ</p></article>' +
      '<div class="dock"><button type="button" class="btn btn-primary" data-action="begin-votes">演じ終わった</button>' +
      '<button type="button" class="btn btn-ghost" data-action="ask-peek">担当を見直す</button>' +
      '<p class="note">演技のあとで押すと、投票が始まります。</p></div></section>');
  }

  function viewVote() {
    const voter = state.players[state.voterList[state.voterStep]];
    const actor = state.players[state.actorCursor];
    const choices = state.situations.map(function (text, index) {
      const on = state.draft.situation === index;
      return '<button type="button" class="choice' + (on ? " is-on" : "") + '" data-action="pick-situation" data-index="' + index + '" aria-pressed="' + on + '">' +
        '<span class="mark">' + LETTERS[index] + "</span><span>" + esc(text) + "</span></button>";
    }).join("");
    const temps = DATA.TEMPS.map(function (temp) {
      const on = state.draft.temp === temp.id;
      return '<button type="button" class="temp-btn' + (on ? " is-on" : "") + '" data-action="pick-temp" data-temp="' + temp.id + '" aria-pressed="' + on + '">' +
        '<span class="temp-mark">' + temp.mark + "</span>" + temp.label + "</button>";
    }).join("");
    const skipOn = state.draft.temp == null;
    const beats = DATA.BEATS.map(function (beat) {
      const on = state.draft.beat === beat.id;
      return '<button type="button" class="temp-btn' + (on ? " is-on" : "") + '" data-action="pick-beat" data-beat="' + beat.id + '" aria-pressed="' + on + '">' +
        '<span class="temp-mark">' + beat.mark + "</span>" + beat.label + "</button>";
    }).join("");
    const beatSkip = state.draft.beat == null;
    return frame('<section class="screen">' + topbar({ quit: true }) +
      '<p class="kicker">投票</p><h1 data-focus>' + esc(voter.name) + "の投票</h1>" +
      '<p class="note">演者 ' + esc(actor.name) + " · お題「" + esc(state.prompt.line) + "」</p>" +
      '<div class="choices">' + choices + "</div>" +
      '<p class="field-label" style="margin-top:16px">温度（状況が合ったときだけ追加点）</p>' +
      '<div class="temp-grid">' + temps +
      '<button type="button" class="temp-btn' + (skipOn ? " is-on" : "") + '" data-action="pick-temp" data-temp="skip" aria-pressed="' + skipOn + '">温度は読まない</button></div>' +
      '<p class="field-label" style="margin-top:16px">間（状況が合ったときだけ追加点）</p>' +
      '<div class="temp-grid">' + beats +
      '<button type="button" class="temp-btn' + (beatSkip ? " is-on" : "") + '" data-action="pick-beat" data-beat="skip" aria-pressed="' + beatSkip + '">間は読まない</button></div>' +
      '<div class="dock"><button type="button" class="btn btn-primary" id="confirm-vote" data-action="confirm-vote"' +
      (state.draft.situation == null ? " disabled" : "") + ">投票する</button></div></section>");
  }

  function viewReveal() {
    const reveal = state.currentReveal;
    const actor = state.players[reveal.actorIndex];
    const temp = tempById(reveal.tempId);
    const beat = beatById(reveal.beatId);
    const situation = state.situations[reveal.situationIndex];
    const rows = reveal.detail.map(function (row) {
      const player = state.players[row.playerIndex];
      const picked = row.pickIndex == null ? "未投票" : LETTERS[row.pickIndex] + " " + state.situations[row.pickIndex];
      const pts = row.pts ? "+" + row.pts : "0";
      return '<li class="vote-row"><div class="vote-top"><span class="who-line"><i class="dot" style="background:' + player.color + '"></i>' +
        esc(player.name) + '</span><b class="' + (row.pts ? "plus" : "") + '">' + pts + "</b></div>" +
        '<p class="pick">' + esc(picked) + "</p>" +
        "<p class=\"judge\">状況 " + (row.sceneOk ? "当たった" : "はずれ") + " · 温度 " + tempJudge(row) + " · 間 " + beatJudge(row) + "</p></li>";
    }).join("");
    const totals = state.players.map(function (player) {
      return '<li><i class="dot" style="background:' + player.color + '"></i>' + esc(player.name) + "<b>" + player.score + "</b></li>";
    }).join("");
    return frame('<section class="screen">' + topbar({ quit: true }) +
      '<p class="kicker">答え</p><h1 data-focus>' + esc(actor.name) + "の息</h1>" +
      '<article class="paper" style="background:' + temp.wash + ";color:" + temp.ink + '">' +
      '<p class="answer-line"><span class="mark">' + LETTERS[reveal.situationIndex] + "</span>" + esc(situation) + "</p>" +
      '<p class="temp-line">' + temp.mark + " " + temp.label + " · " + beat.mark + " " + beat.label + "</p>" +
      '<p class="reaction">' + esc(reaction(reveal)) + "</p></article>" +
      '<p class="note">演者 +' + reveal.actorPts + "</p>" +
      '<ul class="vote-list">' + rows + "</ul>" +
      '<p class="note">温度と間は、状況が合ったときだけ入ります。</p>' +
      '<ul class="totals">' + totals + "</ul>" +
      '<div class="dock"><button type="button" class="btn btn-primary" data-action="next-after-reveal">' + revealNextLabel() + "</button></div></section>");
  }

  function viewMid() {
    const gains = state.players.map(function (player, index) {
      return {
        name: player.name,
        color: player.color,
        index: index,
        gain: player.score - state.scoreAtRoundStart[index],
      };
    }).sort(function (a, b) { return b.gain - a.gain || a.index - b.index; });
    const rows = gains.map(function (row) {
      return '<li class="rank"><span class="who-line"><i class="dot" style="background:' + row.color + '"></i>' +
        esc(row.name) + '</span><b class="plus">+' + row.gain + "</b></li>";
    }).join("");
    return frame('<section class="screen">' + topbar({ quit: true }) +
      '<p class="kicker">ここまで</p><h1 data-focus>「' + esc(state.prompt.line) + "」の得点</h1>" +
      '<ul class="ranks">' + rows + "</ul>" +
      '<p class="note">つぎは、別の一言です。</p>' +
      '<div class="dock"><button type="button" class="btn btn-primary" data-action="next-round">つぎの一言へ</button></div></section>');
  }

  function viewFinal() {
    const ranked = ranking();
    const top = ranked[0].score;
    const winners = ranked.filter(function (row) { return row.score === top; });
    const title = winners.length === 1 ? winners[0].name + "の勝ち" : "同点";
    const rows = ranked.map(function (row) {
      return '<li class="rank' + (row.place === 1 ? " is-first" : "") + '"><span class="place">' + row.place +
        '位</span><span class="who-line"><i class="dot" style="background:' + row.color + '"></i>' +
        esc(row.name) + "</span><b>" + row.score + "点</b></li>";
    }).join("");
    const bestBoth = Math.max.apply(null, state.players.map(function (player) { return player.bothHits; }));
    const readers = state.players.filter(function (player) { return player.bothHits === bestBoth; });
    const bestAct = Math.max.apply(null, state.players.map(function (player) { return player.actorPts; }));
    const passers = state.players.filter(function (player) { return player.actorPts === bestAct; });
    const lines = [];
    if (readers.length === 1 && bestBoth > 0) lines.push(esc(readers[0].name) + "は、温度まで" + bestBoth + "回読んだ。");
    const bestBeat = Math.max.apply(null, state.players.map(function (player) { return player.beatHits; }));
    const beatReaders = state.players.filter(function (player) { return player.beatHits === bestBeat; });
    if (beatReaders.length === 1 && bestBeat > 0) lines.push(esc(beatReaders[0].name) + "は、間まで" + bestBeat + "回読んだ。");
    if (passers.length === 1 && bestAct > 0) lines.push(esc(passers[0].name) + "の息が、いちばん届いた。");
    const flavor = lines.length ? '<p class="note">' + lines.join("<br>") + "</p>" : "";
    const copyLabel = state.copied ? "コピーした" : "結果をコピー";
    return frame('<section class="screen">' + topbar() +
      '<div class="hero hero-sm"><div class="breath-ring" aria-hidden="true"></div>' +
      '<h1 class="final-title" data-focus>' + esc(title) + "</h1></div>" +
      '<ul class="can-select">' + rows + "</ul>" + flavor +
      '<p class="error">' + esc(state.copyError) + "</p>" +
      '<div class="dock"><button type="button" class="btn btn-ghost" data-action="copy-result">' + copyLabel + "</button>" +
      '<button type="button" class="btn btn-primary" data-action="again">もう一度</button>' +
      '<button type="button" class="btn btn-ghost" data-action="go-title">タイトルへ</button></div></section>');
  }

  function viewModal() {
    const reset = state.modal && state.modal.kind === "reset";
    const text = reset ? "集めたしるしを消します。" : "ここまでの得点は消えます。";
    const ok = reset ? "消す" : "タイトルへ";
    return '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><p>' + text + "</p>" +
      '<div class="stack"><button type="button" class="btn btn-primary" data-action="confirm-modal">' + ok + "</button>" +
      '<button type="button" class="btn btn-ghost" data-action="cancel-modal">つづける</button></div></div></div>';
  }

  function render() {
    const views = {
      title: viewTitle,
      how: viewHow,
      setup: viewSetup,
      zukan: viewZukan,
      intro: viewIntro,
      pass: viewPass,
      secret: viewSecret,
      center: viewCenter,
      table: viewTable,
      vote: viewVote,
      reveal: viewReveal,
      mid: viewMid,
      final: viewFinal,
    };
    const view = views[state.phase] || viewTitle;
    try {
      app.innerHTML = view();
    } catch (err) {
      console.error(err);
      app.textContent = "画面を開けませんでした。ページを開き直してください。";
      return;
    }
    const titles = {
      title: "はぁの温度",
      how: "あそびかた · はぁの温度",
      setup: "メンバー · はぁの温度",
      zukan: "しるし · はぁの温度",
      final: "結果 · はぁの温度",
    };
    document.title = titles[state.phase] || "はぁの温度";
    const focus = state.modal
      ? app.querySelector(".modal [data-action='cancel-modal']")
      : app.querySelector("[data-focus]");
    if (focus) {
      focus.setAttribute("tabindex", "-1");
      try { focus.focus({ preventScroll: true }); } catch (err) { focus.focus(); }
    }
  }

  const actions = {
    "go-how": function () { state.phase = "how"; render(); },
    "go-setup": function () { state.phase = "setup"; state.setupError = ""; state.modal = null; render(); },
    "go-title": goTitle,
    "go-zukan": function () { state.phase = "zukan"; state.modal = null; render(); },
    "quick-start": function () {
      state.mode = "mix";
      state.roundsTotal = 1;
      startGame(["あおい", "れん", "すず"], false);
    },
    "add-player": function () {
      if (state.roster.length >= 8) return;
      state.roster.push({ name: "" });
      state.setupError = "";
      render();
      const inputs = app.querySelectorAll("[data-rename]");
      const last = inputs[inputs.length - 1];
      if (last) last.focus();
    },
    "remove-player": function (btn) {
      if (state.roster.length <= 2) return;
      state.roster.splice(Number(btn.dataset.index), 1);
      state.setupError = "";
      render();
    },
    "set-mode": function (btn) { state.mode = btn.dataset.value; render(); },
    "set-rounds": function (btn) { state.roundsTotal = Number(btn.dataset.value); render(); },
    "toggle-sound": function () { state.sound = !state.sound; persist(); render(); },
    "start-game": startFromSetup,
    "start-deal": function () { state.dealIndex = 0; openDealPass(); },
    "advance-pass": advancePass,
    "hide-secret": hideSecret,
    "to-table": function () { state.phase = "table"; render(); },
    "ask-peek": function () { state.passKind = "peek"; state.phase = "pass"; render(); },
    "begin-votes": beginVotes,
    "pick-situation": function (btn) { selectSituation(Number(btn.dataset.index)); },
    "pick-temp": function (btn) { selectTemp(btn.dataset.temp); },
    "pick-beat": function (btn) { selectBeat(btn.dataset.beat); },
    "confirm-vote": confirmVote,
    "next-after-reveal": nextAfterReveal,
    "next-round": function () { state.roundIndex += 1; beginRound(); },
    "again": function () { startGame(state.players.map(function (player) { return player.name; }), state.remember); },
    "copy-result": copyResult,
    "ask-quit": function () { state.modal = { kind: "quit" }; render(); },
    "ask-reset": function () { state.modal = { kind: "reset" }; render(); },
    "confirm-modal": function () {
      if (state.modal && state.modal.kind === "reset") {
        state.unlocked = [];
        state.modal = null;
        persist();
        render();
        return;
      }
      goTitle();
    },
    "cancel-modal": function () { state.modal = null; render(); },
  };

  function onAppClick(event) {
    const btn = event.target.closest("[data-action]");
    if (!btn || !app.contains(btn)) return;
    if (state.modal && !btn.closest(".modal")) return;
    const action = btn.dataset.action;
    const now = Date.now();
    if (now < lockUntil) return;
    if (action !== "pick-situation" && action !== "pick-temp" && action !== "pick-beat") lockUntil = now + 320;
    const fn = actions[action];
    if (fn) fn(btn);
  }

  function onInput(event) {
    const input = event.target;
    if (!input.dataset || input.dataset.rename == null || input.dataset.rename === "") return;
    const index = Number(input.dataset.rename);
    if (!state.roster[index]) return;
    state.roster[index].name = input.value;
    if (state.setupError) {
      state.setupError = "";
      const error = app.querySelector(".error");
      if (error) error.textContent = "";
    }
  }

  const stored = loadStore();
  state.sound = stored.sound;
  state.unlocked = stored.prompts.filter(function (id) {
    return DATA.PROMPTS.some(function (prompt) { return prompt.id === id; });
  });
  state.savedNames = stored.names.map(cleanName).filter(Boolean).slice(0, 8);
  if (state.savedNames.length >= 2) {
    state.roster = state.savedNames.map(function (name) { return { name: name }; });
  }

  app.addEventListener("click", onAppClick);
  app.addEventListener("input", onInput);
  app.addEventListener("change", onInput);
  render();
})();
