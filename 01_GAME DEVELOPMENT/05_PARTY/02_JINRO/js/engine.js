"use strict";

/**
 * 月下の人狼 — 進行エンジン
 * フェーズ: deal → night → morning → day → vote → executed | no-execution | revote → …
 * 決着時は phase = end
 */
const Jinro = (() => {
  const ROLE_META = {
    villager: {
      name: "村人",
      team: "village",
      teamLabel: "村人陣営",
      color: "#2f6f4e",
      blurb: "能力はない。議論と投票で人狼を探す。",
      detail: "特別な能力はない。誰が嘘をついているかを見抜き、投票で人狼を吊ろう。",
      win: "人狼が全滅し、妖狐が生き残っていなければ勝ち。",
    },
    seer: {
      name: "占い師",
      team: "village",
      teamLabel: "村人陣営",
      color: "#245b86",
      blurb: "毎夜ひとりを占う。妖狐を占うと呪殺。",
      detail: "毎夜、自分以外の生存者ひとりを占い、人間か人狼かを知る。妖狐を占うと呪殺し、その相手は朝までもたない。",
      win: "人狼が全滅し、妖狐が生き残っていなければ勝ち。",
    },
    medium: {
      name: "霊媒師",
      team: "village",
      teamLabel: "村人陣営",
      color: "#5a3d86",
      blurb: "吊られた人の役職が、次の夜にわかる。",
      detail: "前日の投票で吊られた人物の役職が、次の夜にだけわかる。襲撃で死んだ人の役職はわからない。",
      win: "人狼が全滅し、妖狐が生き残っていなければ勝ち。",
    },
    hunter: {
      name: "狩人",
      team: "village",
      teamLabel: "村人陣営",
      color: "#3e5c28",
      blurb: "毎夜ひとりを襲撃から守る。連続守護はできない。",
      detail: "毎夜、自分以外のひとりを人狼の襲撃から守る。同じ相手を連続の夜では守れない。自分は守れない。",
      win: "人狼が全滅し、妖狐が生き残っていなければ勝ち。",
    },
    mason: {
      name: "共有者",
      team: "village",
      teamLabel: "村人陣営",
      color: "#0f6e72",
      blurb: "相方の共有者が誰か最初からわかる。",
      detail: "ほかの共有者が誰か、最初からわかっている。相方を信じられるかが腕の見せどころ。",
      win: "人狼が全滅し、妖狐が生き残っていなければ勝ち。",
    },
    cat: {
      name: "猫又",
      team: "village",
      teamLabel: "村人陣営",
      color: "#8a4b2f",
      blurb: "人狼に襲われると、襲った狼を道連れにする。",
      detail: "人狼に襲われ、狩人に守られていなければ死亡し、襲った人狼ひとりを道連れに倒す。占いでは人間。",
      win: "人狼が全滅し、妖狐が生き残っていなければ勝ち。",
    },
    wolf: {
      name: "人狼",
      team: "wolf",
      teamLabel: "人狼陣営",
      color: "#8d2f2f",
      blurb: "毎夜ひとりを襲う。仲間の狼がわかる。",
      detail: "毎夜、仲間と相談して人間をひとり襲う。仲間の人狼が誰かは最初からわかる。妖狐を襲っても倒せない。",
      win: "生存している人狼の数が、人間の数以上になれば勝ち。",
    },
    madman: {
      name: "狂人",
      team: "wolf",
      teamLabel: "人狼陣営",
      color: "#7a3b45",
      blurb: "人間だが、人狼陣営が勝つと勝ち。占いは人間。",
      detail: "能力はない。人間として数えられるが、勝ちは人狼陣営と同じ。占いでも霊媒でも人間側の役として出る。仲間の狼はわからない。",
      win: "人狼陣営が勝ったとき、一緒に勝つ。",
    },
    hanged: {
      name: "吊人",
      team: "third",
      teamLabel: "第三陣営",
      color: "#6d4a86",
      blurb: "投票で吊られた瞬間、単独で勝つ。",
      detail: "投票で吊られたその瞬間に、ほかの陣営を差し置いて単独勝利する。夜の襲撃で死んでも勝利にはならない。",
      win: "投票で自分が吊られたときだけ勝ち。",
    },
    fox: {
      name: "妖狐",
      team: "third",
      teamLabel: "第三陣営",
      color: "#c47b2b",
      blurb: "最後まで生き残れば勝ち。占われると死ぬ。",
      detail: "決着のときに生き残っていれば勝利する。占い師に占われると呪殺される。人狼に襲われても死なない。",
      win: "村や狼の決着がついたとき、生きていれば勝ち。",
    },
  };

  const ROLE_ORDER = ["villager", "seer", "medium", "hunter", "mason", "cat", "wolf", "madman", "hanged", "fox"];

  const CPU_NAMES = ["さくら", "蓮", "葵", "樹", "凛", "陽太", "結衣", "蒼", "楓", "美月", "陸", "心春", "大和", "鈴", "湊", "杏", "律", "萩", "凪", "朱里", "柊", "翠"];

  const PRESETS = {
    4: { villager: 2, seer: 1, wolf: 1 },
    5: { villager: 1, seer: 1, wolf: 1, madman: 1, hanged: 1 },
    6: { villager: 1, seer: 1, medium: 1, wolf: 1, madman: 1, hanged: 1 },
    7: { villager: 1, seer: 1, medium: 1, hunter: 1, wolf: 1, madman: 1, hanged: 1 },
    8: { villager: 1, seer: 1, medium: 1, hunter: 1, wolf: 2, madman: 1, hanged: 1 },
    9: { villager: 2, seer: 1, medium: 1, hunter: 1, wolf: 2, madman: 1, hanged: 1 },
    10: { villager: 1, seer: 1, medium: 1, hunter: 1, mason: 2, wolf: 2, madman: 1, hanged: 1 },
    11: { villager: 2, seer: 1, medium: 1, hunter: 1, mason: 2, wolf: 2, madman: 1, hanged: 1 },
    12: { villager: 2, seer: 1, medium: 1, hunter: 1, mason: 2, cat: 1, wolf: 2, madman: 1, hanged: 1 },
    13: { villager: 2, seer: 1, medium: 1, hunter: 1, mason: 2, cat: 1, wolf: 2, madman: 1, hanged: 1, fox: 1 },
    14: { villager: 3, seer: 1, medium: 1, hunter: 1, mason: 2, cat: 1, wolf: 3, madman: 1, hanged: 1 },
    15: { villager: 3, seer: 1, medium: 1, hunter: 1, mason: 2, cat: 1, wolf: 3, madman: 1, hanged: 1, fox: 1 },
    16: { villager: 4, seer: 1, medium: 1, hunter: 1, mason: 2, cat: 1, wolf: 3, madman: 1, hanged: 1, fox: 1 },
  };

  let seq = 1;
  function uid(prefix) {
    seq += 1;
    return prefix + seq;
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function blankComposition() {
    const comp = {};
    ROLE_ORDER.forEach((id) => {
      comp[id] = 0;
    });
    return comp;
  }

  function normalizeComposition(raw) {
    const comp = blankComposition();
    ROLE_ORDER.forEach((id) => {
      const n = Math.max(0, Math.floor(Number(raw && raw[id]) || 0));
      comp[id] = n;
    });
    return comp;
  }

  function sumComposition(comp) {
    return ROLE_ORDER.reduce((sum, id) => sum + (comp[id] || 0), 0);
  }

  function recommendedComposition(total) {
    const n = Math.max(4, Math.min(16, total));
    return normalizeComposition(PRESETS[n] || PRESETS[10]);
  }

  function validateComposition(raw, total) {
    const comp = normalizeComposition(raw);
    const errors = [];
    const sum = sumComposition(comp);
    const wolves = comp.wolf;
    const foxes = comp.fox;
    const humans = sum - wolves - foxes;
    if (total < 4) errors.push("参加者は4人以上にしてください。2人ならCPUを足します。");
    if (total > 16) errors.push("参加者は16人までです。");
    if (sum !== total) errors.push("配役の合計が " + sum + " 人、参加者が " + total + " 人です。");
    if (wolves < 1) errors.push("人狼を1人以上入れてください。");
    if (comp.mason === 1) errors.push("共有者は0人か、2人以上にしてください。");
    if (comp.hanged > 2) errors.push("吊人は2人までです。");
    if (comp.fox > 2) errors.push("妖狐は2人までです。");
    if (comp.seer > 3) errors.push("占い師は3人までです。");
    if (comp.medium > 2) errors.push("霊媒師は2人までです。");
    if (comp.hunter > 2) errors.push("狩人は2人までです。");
    if (comp.madman > 3) errors.push("狂人は3人までです。");
    if (comp.cat > 2) errors.push("猫又は2人までです。");
    if (wolves >= 1 && wolves >= humans) {
      errors.push("この配役は、始まった瞬間に人狼陣営の勝ちになります。人間を増やすか、人狼を減らしてください。");
    }
    return { ok: errors.length === 0, errors, composition: comp };
  }

  function compositionText(comp) {
    return ROLE_ORDER.filter((id) => comp[id] > 0)
      .map((id) => ROLE_META[id].name + comp[id])
      .join("、");
  }

  function livingPlayers(game) {
    return game.players.filter((p) => p.alive);
  }

  function getPlayer(game, id) {
    const found = game.players.find((p) => p.id === id);
    if (!found) throw new Error("プレイヤーが見つかりません");
    return found;
  }

  function findByName(game, name) {
    return game.players.find((p) => p.name === name) || null;
  }

  function roleName(role) {
    return (ROLE_META[role] && ROLE_META[role].name) || "不明";
  }

  function pushSystem(game, text) {
    game.chat.push({
      id: uid("c"),
      playerId: null,
      kind: "system",
      text,
      day: game.day,
      tag: "",
    });
  }

  function refreshKnowledge(players) {
    const wolves = players.filter((p) => p.role === "wolf");
    const masons = players.filter((p) => p.role === "mason");
    players.forEach((p) => {
      p.memory = { seer: [], medium: [], mates: [] };
      if (p.role === "wolf") p.memory.mates = wolves.filter((w) => w.id !== p.id).map((w) => w.id);
      if (p.role === "mason") p.memory.mates = masons.filter((m) => m.id !== p.id).map((m) => m.id);
    });
  }

  function deckFrom(comp) {
    const deck = [];
    ROLE_ORDER.forEach((role) => {
      for (let i = 0; i < (comp[role] || 0); i += 1) deck.push(role);
    });
    return deck;
  }

  function sameMultiset(a, b) {
    if (a.length !== b.length) return false;
    const count = {};
    a.forEach((role) => {
      count[role] = (count[role] || 0) + 1;
    });
    for (let i = 0; i < b.length; i += 1) {
      if (!count[b[i]]) return false;
      count[b[i]] -= 1;
    }
    return true;
  }

  function dedupeName(name, used) {
    const base = (name || "").trim() || "プレイヤー";
    let next = base;
    let n = 2;
    while (used.has(next)) {
      next = base + n;
      n += 1;
    }
    used.add(next);
    return next;
  }

  function createGame(config) {
    const humans = (config.humans || []).map((h) => ({ name: (h.name || "").trim() }));
    const cpuCount = Math.max(0, Math.floor(Number(config.cpuCount) || 0));
    const total = humans.length + cpuCount;
    const check = validateComposition(config.composition, total);
    if (!check.ok) throw new Error(check.errors.join("\n"));
    const composition = check.composition;
    let deck = deckFrom(composition);
    if (config.assignments) {
      if (!sameMultiset(config.assignments, deck)) {
        throw new Error("指定配役が人数と一致しません");
      }
      deck = config.assignments.slice();
    } else {
      deck = shuffle(deck);
    }

    const used = new Set();
    const people = humans.map((h, index) => ({
      id: uid("p"),
      name: dedupeName(h.name || "プレイヤー" + (index + 1), used),
      isCpu: false,
      entry: index,
    }));
    const pool = shuffle(CPU_NAMES.filter((name) => !used.has(name)));
    for (let i = 0; i < cpuCount; i += 1) {
      const base = pool[i] || "CPU" + (i + 1);
      people.push({
        id: uid("p"),
        name: dedupeName(base, used),
        isCpu: true,
        entry: 100 + i,
      });
    }
    people.forEach((p, index) => {
      p.role = deck[index];
      p.alive = true;
      p.seat = index;
      p.nightPick = null;
      p.lastGuard = null;
      p.deathCause = null;
      p.deathDay = null;
    });
    refreshKnowledge(people);
    const seated = shuffle(people);
    seated.forEach((p, index) => {
      p.seat = index;
    });

    const game = {
      phase: "deal",
      day: 0,
      players: seated,
      composition,
      revealRoles: !!config.revealRoles,
      claims: [],
      pressures: [],
      intents: {},
      chat: [],
      votes: {},
      voteRound: 0,
      voteCandidates: null,
      revoteCandidates: null,
      currentTally: null,
      lastExecuted: null,
      morningDeaths: [],
      history: { votes: [], deaths: [] },
      winners: null,
      dayScript: [],
      _wolfBloc: null,
      setup: {
        humans: humans.map((h) => ({ name: h.name || "" })),
        cpuCount,
        composition: Object.assign({}, composition),
        revealRoles: !!config.revealRoles,
      },
    };
    pushSystem(game, "この村の配役は " + compositionText(composition) + "。役の内訳は全員が知っている。誰がどの役かは秘密。");
    return game;
  }

  function livingHumans(game) {
    return livingPlayers(game)
      .filter((p) => !p.isCpu)
      .sort((a, b) => a.entry - b.entry);
  }

  function humanNightTurns(game) {
    const order = { wolf: 0, seer: 1, medium: 2, hunter: 3 };
    const turns = [];
    livingHumans(game).forEach((p) => {
      if (game.day === 1 && (p.role === "wolf" || p.role === "hunter")) return;
      if (p.role === "wolf" || p.role === "seer" || p.role === "hunter") {
        turns.push({ playerId: p.id, kind: p.role });
      } else if (p.role === "medium" && p.memory.medium.some((row) => row.fresh)) {
        turns.push({ playerId: p.id, kind: "medium" });
      }
    });
    turns.sort((a, b) => order[a.kind] - order[b.kind] || getPlayer(game, a.playerId).entry - getPlayer(game, b.playerId).entry);
    return turns;
  }

  function guardChoices(game, hunter) {
    const others = livingPlayers(game).filter((p) => p.id !== hunter.id);
    const fresh = others.filter((p) => p.id !== hunter.lastGuard);
    return fresh.length ? fresh : others;
  }

  function nightOptions(game, player) {
    if (player.role === "wolf") {
      return livingPlayers(game)
        .filter((p) => p.role !== "wolf")
        .map((p) => ({ id: p.id, disabled: false, reason: "" }));
    }
    if (player.role === "seer") {
      return livingPlayers(game)
        .filter((p) => p.id !== player.id)
        .map((p) => ({ id: p.id, disabled: false, reason: "" }));
    }
    if (player.role === "hunter") {
      const allowed = new Set(guardChoices(game, player).map((p) => p.id));
      return livingPlayers(game)
        .filter((p) => p.id !== player.id)
        .map((p) => ({
          id: p.id,
          disabled: !allowed.has(p.id),
          reason: allowed.has(p.id) ? "" : "昨夜と同じ相手は守れない",
        }));
    }
    return [];
  }

  function divinePreview(target) {
    if (!target) return null;
    if (target.role === "fox") return "fox";
    if (target.role === "wolf") return "wolf";
    return "human";
  }

  function resultLabel(result) {
    if (result === "wolf") return "人狼";
    if (result === "fox") return "妖狐";
    return "人間";
  }

  function startNight(game) {
    if (game.winners) return;
    if (!["deal", "executed", "no-execution"].includes(game.phase)) {
      throw new Error("いまは夜を始められません");
    }
    game.day += 1;
    game.phase = "night";
    game.morningDeaths = [];
    game.players.forEach((p) => {
      p.nightPick = null;
    });
    if (game.lastExecuted && !game.lastExecuted.seen) {
      livingPlayers(game)
        .filter((p) => p.role === "medium")
        .forEach((m) => {
          m.memory.medium.push({
            day: game.lastExecuted.day,
            targetId: game.lastExecuted.playerId,
            role: game.lastExecuted.role,
            fresh: true,
          });
        });
      game.lastExecuted.seen = true;
    }
    pushSystem(game, game.day === 1
      ? "第1夜。最初の夜、人狼は襲わない。占いだけが動く。"
      : "第" + game.day + "夜。村の灯が落ち、能力を持つ者だけが目を覚ます。");
  }

  function majority(ids) {
    const counts = {};
    ids.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    let best = 0;
    Object.keys(counts).forEach((id) => {
      if (counts[id] > best) best = counts[id];
    });
    const top = Object.keys(counts).filter((id) => counts[id] === best);
    return top[Math.floor(Math.random() * top.length)];
  }

  function morningLine(game, deaths) {
    if (!deaths.length) return "静かな朝を迎えた。昨夜の犠牲者はいない。";
    const names = deaths.map((d) => getPlayer(game, d.playerId).name);
    if (names.length === 1) return "朝日の下で、" + names[0] + " が息絶えているのが見つかった。";
    return "朝日の下で、" + names.join(" と ") + " が息絶えているのが見つかった。";
  }

  function winningPlayers(game, teams) {
    const picked = [];
    game.players.forEach((p) => {
      if (teams.indexOf("village") >= 0 && ROLE_META[p.role].team === "village") picked.push(p);
      if (teams.indexOf("wolf") >= 0 && (p.role === "wolf" || p.role === "madman")) picked.push(p);
      if (teams.indexOf("fox") >= 0 && p.role === "fox" && p.alive) picked.push(p);
      if (teams.indexOf("hanged") >= 0 && p.role === "hanged" && p.deathCause === "execute") picked.push(p);
    });
    return picked;
  }

  function judge(game) {
    const alive = livingPlayers(game);
    const wolves = alive.filter((p) => p.role === "wolf");
    const foxes = alive.filter((p) => p.role === "fox");
    const humans = alive.filter((p) => p.role !== "wolf" && p.role !== "fox");
    if (wolves.length === 0) {
      if (foxes.length) {
        return { teams: ["fox"], reason: "人狼は全滅したが、妖狐が生き残っている。村人の勝利にはならない。" };
      }
      return { teams: ["village"], reason: "人狼は全滅し、妖狐もいない。村に朝が戻った。" };
    }
    if (wolves.length >= humans.length) {
      const teams = ["wolf"];
      let reason = "生存している人狼の数が、人間の数以上になった。";
      if (foxes.length) {
        teams.push("fox");
        reason += "妖狐も生きて決着を迎えた。";
      }
      return { teams, reason };
    }
    return null;
  }

  function applyWinners(game, result) {
    const players = winningPlayers(game, result.teams);
    game.winners = {
      teams: result.teams,
      reason: result.reason,
      playerIds: players.map((p) => p.id),
    };
    game.phase = "end";
  }

  function resolveNight(game) {
    if (game.phase !== "night") throw new Error("いまは夜ではありません");
    const wolves = livingPlayers(game).filter((p) => p.role === "wolf");
    const hunters = livingPlayers(game).filter((p) => p.role === "hunter");
    const seers = livingPlayers(game).filter((p) => p.role === "seer");

    hunters.forEach((h) => {
      if (h.isCpu) h.nightPick = JinroAITarget("hunter", game, h);
    });
    seers.forEach((s) => {
      if (s.isCpu) s.nightPick = JinroAITarget("seer", game, s);
    });

    let wolfTargetId = null;
    if (wolves.length && game.day > 1) {
      const humanPicks = wolves.filter((w) => !w.isCpu && w.nightPick).map((w) => w.nightPick);
      if (humanPicks.length) wolfTargetId = majority(humanPicks);
      else wolfTargetId = JinroAITarget("wolf", game, wolves[0]);
      const valid = livingPlayers(game).filter((p) => p.role !== "wolf").map((p) => p.id);
      if (valid.length && valid.indexOf(wolfTargetId) < 0) wolfTargetId = valid[0];
      if (!valid.length) wolfTargetId = null;
    }

    const guarded = new Set();
    hunters.forEach((h) => {
      const targetId = h.nightPick;
      const choices = guardChoices(game, h);
      if (!targetId || !choices.some((p) => p.id === targetId)) return;
      guarded.add(targetId);
      h.lastGuard = targetId;
    });

    const deaths = new Map();
    seers.forEach((s) => {
      const target = s.nightPick ? game.players.find((p) => p.id === s.nightPick && p.alive) : null;
      if (!target || target.id === s.id) return;
      const result = divinePreview(target);
      s.memory.seer.push({ day: game.day, targetId: target.id, result });
      if (result === "fox") deaths.set(target.id, "curse");
    });

    if (wolfTargetId) {
      const target = getPlayer(game, wolfTargetId);
      if (target.alive && target.role !== "fox" && !guarded.has(target.id)) {
        if (target.role === "cat") {
          deaths.set(target.id, "cat");
          const pool = wolves.filter((w) => w.alive && !deaths.has(w.id));
          const biters = pool.length ? pool : wolves;
          const biter = biters[Math.floor(Math.random() * biters.length)];
          deaths.set(biter.id, "revenge");
        } else if (!deaths.has(target.id)) {
          deaths.set(target.id, "wolf");
        }
      }
    }

    const morningDeaths = [];
    game.players.forEach((p) => {
      if (!deaths.has(p.id)) return;
      p.alive = false;
      p.deathCause = deaths.get(p.id);
      p.deathDay = game.day;
      morningDeaths.push({ playerId: p.id, cause: p.deathCause });
      game.history.deaths.push({ day: game.day, playerId: p.id, cause: p.deathCause });
    });
    game.players.forEach((p) => {
      p.nightPick = null;
    });
    game.morningDeaths = morningDeaths;
    pushSystem(game, morningLine(game, morningDeaths));
    const result = judge(game);
    if (result) {
      applyWinners(game, result);
      pushSystem(game, "この朝、村の運命は決した。");
    } else {
      game.phase = "morning";
    }
    return morningDeaths;
  }

  function JinroAITarget(kind, game, player) {
    const ai = globalThis.JinroAI;
    if (!ai) return null;
    if (kind === "wolf") return ai.wolfKillTarget(game);
    if (kind === "seer") return ai.seerTarget(game, player);
    if (kind === "hunter") return ai.hunterTarget(game, player);
    return null;
  }

  function causeLabel(cause) {
    if (cause === "wolf") return "襲撃";
    if (cause === "curse") return "呪殺";
    if (cause === "cat") return "襲撃（猫又）";
    if (cause === "revenge") return "猫又の道連れ";
    if (cause === "execute") return "吊り";
    return "";
  }

  function winnerTitle(teams) {
    const key = teams.slice().sort().join("+");
    if (key === "village") return "村人陣営の勝利";
    if (key === "wolf") return "人狼陣営の勝利";
    if (key === "fox") return "妖狐の勝利";
    if (key === "fox+wolf") return "人狼と妖狐の勝利";
    if (key === "hanged") return "吊人の勝利";
    return "決着";
  }

  function statementsKey(list) {
    return JSON.stringify(list || []);
  }

  function upsertClaim(game, playerId, role, statements) {
    let claim = game.claims.find((c) => c.playerId === playerId && c.role === role);
    if (!claim) {
      claim = { playerId, role, day: game.day, statements: [] };
      game.claims.push(claim);
    }
    claim.statements = (statements || []).map((s) => Object.assign({}, s));
    claim.day = game.day;
    return claim;
  }

  function addPressure(game, playerId, targetId, kind) {
    game.pressures = game.pressures.filter((p) => !(p.playerId === playerId && p.day === game.day));
    if (!targetId || !kind) return;
    game.pressures.push({ playerId, targetId, kind, day: game.day });
  }

  function tagOf(line) {
    if (line.claim) return "CO";
    if (line.intent) return "票";
    if (!line.pressure) return "";
    if (line.pressure.kind === "suspect") return "疑い";
    if (line.pressure.kind === "defend") return "擁護";
    if (line.pressure.kind === "self") return "自認";
    return "";
  }

  function setIntent(game, playerId, targetId) {
    if (!game.intents) game.intents = {};
    if (!targetId || targetId === playerId) return false;
    const target = game.players.find((p) => p.id === targetId && p.alive);
    const voter = game.players.find((p) => p.id === playerId && p.alive);
    if (!target || !voter) return false;
    game.intents[playerId] = targetId;
    return true;
  }

  function commitScriptLine(game, line) {
    if (line.claim) upsertClaim(game, line.playerId, line.claim.role, line.claim.statements);
    if (line.pressure) addPressure(game, line.playerId, line.pressure.targetId, line.pressure.kind);
    if (line.intent) setIntent(game, line.playerId, line.intent);
    game.chat.push({
      id: uid("c"),
      playerId: line.playerId,
      kind: line.claim ? "co" : "talk",
      text: line.text,
      day: game.day,
      tag: tagOf(line),
    });
  }

  function flushDayScript(game) {
    const script = game.dayScript || [];
    while (script.length) commitScriptLine(game, script.shift());
  }

  function startDay(game) {
    if (game.winners) return;
    if (game.phase !== "morning") throw new Error("朝を終えてから昼になります");
    game.phase = "day";
    game.voteRound = 1;
    game.voteCandidates = null;
    game.intents = {};
    game.dayScript = globalThis.JinroAI ? globalThis.JinroAI.buildDayScript(game) : [];
    pushSystem(game, game.day + "日目の昼。生存者は意見を交わし、その後ひとりを選んで吊ります。");
  }

  function humanTalk(game, playerId, text, pressure) {
    const body = (text || "").trim();
    if (!body) return;
    if (pressure && pressure.kind) addPressure(game, playerId, pressure.targetId, pressure.kind);
    game.chat.push({
      id: uid("c"),
      playerId,
      kind: "talk",
      text: body.slice(0, 80),
      day: game.day,
      tag: pressure ? tagOf({ pressure }) : "",
    });
    if (globalThis.JinroAI) {
      const extra = globalThis.JinroAI.reactToTalk(game, playerId, body, pressure);
      game.dayScript = extra.concat(game.dayScript || []);
    }
  }

  function declareIntent(game, playerId, targetId) {
    if (!setIntent(game, playerId, targetId)) return false;
    const speaker = getPlayer(game, playerId);
    const target = getPlayer(game, targetId);
    addPressure(game, playerId, targetId, "suspect");
    game.chat.push({
      id: uid("c"),
      playerId,
      kind: "talk",
      text: "今日の票は " + target.name + " に置く。",
      day: game.day,
      tag: "票",
    });
    if (globalThis.JinroAI) {
      const spoken = "今日の票は" + target.name + "に置く。";
      const extra = globalThis.JinroAI.reactToTalk(game, playerId, spoken, { kind: "suspect", targetId });
      game.dayScript = extra.concat(game.dayScript || []);
    }
    return true;
  }

  function humanComingOut(game, playerId, role, statements) {
    const claim = upsertClaim(game, playerId, role, statements);
    const speaker = getPlayer(game, playerId);
    game.chat.push({
      id: uid("c"),
      playerId,
      kind: "co",
      text: speaker.name + " が " + roleName(role) + " をカミングアウトした。" + describeClaim(game, claim),
      day: game.day,
      tag: "CO",
    });
    if (globalThis.JinroAI) {
      const extra = globalThis.JinroAI.reactToClaim(game, claim);
      game.dayScript = extra.concat(game.dayScript || []);
    }
  }

  function describeClaim(game, claim) {
    if (!claim.statements || !claim.statements.length) return "";
    if (claim.role === "seer") {
      return claim.statements
        .map((s) => {
          const target = getPlayer(game, s.targetId);
          return target.name + "は" + resultLabel(s.result);
        })
        .join("、") + "。";
    }
    if (claim.role === "medium") {
      return claim.statements
        .map((s) => {
          const target = getPlayer(game, s.targetId);
          return s.day + "日目に吊られた" + target.name + "は" + roleName(s.role);
        })
        .join("、") + "。";
    }
    if (claim.role === "mason") {
      return claim.statements
        .map((s) => "相方は" + getPlayer(game, s.targetId).name)
        .join("、") + "。";
    }
    return "";
  }

  function currentCandidates(game) {
    if (game.voteCandidates && game.voteCandidates.length) {
      return game.voteCandidates.filter((id) => {
        const p = game.players.find((x) => x.id === id);
        return p && p.alive;
      });
    }
    return livingPlayers(game).map((p) => p.id);
  }

  function voteIsValid(game, voterId, targetId) {
    if (!targetId || targetId === voterId) return false;
    return currentCandidates(game).indexOf(targetId) >= 0;
  }

  function startVotingRound(game, candidates) {
    if (game.winners) return;
    if (candidates && candidates.length) {
      game.voteRound += 1;
      game.voteCandidates = candidates.slice();
      game.phase = "vote";
    } else {
      if (game.phase !== "day" && game.phase !== "revote") throw new Error("投票に進めません");
      game.voteRound = 1;
      game.voteCandidates = null;
      game.phase = "vote";
    }
    game.votes = {};
    game._wolfBloc = null;
    const pool = currentCandidates(game);
    livingPlayers(game).forEach((p) => {
      if (!p.isCpu) return;
      const target = globalThis.JinroAI.chooseVote(game, p, pool);
      if (voteIsValid(game, p.id, target)) game.votes[p.id] = target;
    });
    const label = game.voteRound > 1 ? "再投票" : "投票";
    pushSystem(game, game.day + "日目の" + label + "。開票まで、誰が誰に入れたかは秘密。");
  }

  function castVote(game, voterId, targetId) {
    if (!voteIsValid(game, voterId, targetId)) throw new Error("その相手には投票できません");
    game.votes[voterId] = targetId;
  }

  function missingVoters(game) {
    return livingPlayers(game).filter((p) => !voteIsValid(game, p.id, game.votes[p.id]));
  }

  function fillMissingVotes(game) {
    const pool = currentCandidates(game);
    missingVoters(game).forEach((p) => {
      const target = globalThis.JinroAI.chooseVote(game, p, pool);
      if (voteIsValid(game, p.id, target)) game.votes[p.id] = target;
    });
  }

  function tallyVotes(game) {
    const candidates = currentCandidates(game);
    const counts = {};
    candidates.forEach((id) => {
      counts[id] = 0;
    });
    const ballots = [];
    livingPlayers(game).forEach((p) => {
      const target = game.votes[p.id];
      if (!voteIsValid(game, p.id, target)) return;
      counts[target] += 1;
      ballots.push({ voterId: p.id, targetId: target });
    });
    let max = 0;
    candidates.forEach((id) => {
      if (counts[id] > max) max = counts[id];
    });
    const top = candidates.filter((id) => counts[id] === max);
    return { counts, top, max, ballots, candidates, round: game.voteRound };
  }

  function executePlayer(game, playerId) {
    const target = getPlayer(game, playerId);
    target.alive = false;
    target.deathCause = "execute";
    target.deathDay = game.day;
    game.history.deaths.push({ day: game.day, playerId: target.id, cause: "execute" });
    game.lastExecuted = { playerId: target.id, role: target.role, day: game.day, seen: false };
    pushSystem(game, target.name + " が吊られた。役職は、まだ村には明かされていない。");
    if (target.role === "hanged") {
      applyWinners(game, {
        teams: ["hanged"],
        reason: target.name + " は吊人だった。吊られた瞬間、吊人の単独勝利が成立する。",
      });
      pushSystem(game, target.name + " は吊人だった。縄の上で、吊人の勝ちが決まった。");
      return;
    }
    const result = judge(game);
    if (result) {
      applyWinners(game, result);
      pushSystem(game, "吊りのあと、村の運命は決した。");
    } else {
      game.phase = "executed";
    }
  }

  function resolveVotingRound(game) {
    if (game.phase !== "vote") throw new Error("投票中ではありません");
    const missing = missingVoters(game);
    if (missing.length) return { type: "incomplete", missing: missing.map((p) => p.id) };
    const tally = tallyVotes(game);
    game.currentTally = tally;
    game.history.votes.push({
      day: game.day,
      round: game.voteRound,
      ballots: tally.ballots.map((b) => Object.assign({}, b)),
    });
    if (tally.top.length === 1) {
      executePlayer(game, tally.top[0]);
      return { type: "executed", playerId: tally.top[0], tally };
    }
    const names = tally.top.map((id) => getPlayer(game, id).name).join(" と ");
    if (game.voteRound >= 2) {
      pushSystem(game, "再投票も " + names + " で割れた。今日は誰も吊られない。");
      game.phase = "no-execution";
      return { type: "peace", tally };
    }
    game.revoteCandidates = tally.top.slice();
    game.phase = "revote";
    pushSystem(game, "票が割れた。" + names + " で再投票になる。");
    return { type: "revote", candidates: tally.top.slice(), tally };
  }

  function runToEnd(game) {
    let safety = 0;
    while (!game.winners && safety < 80) {
      safety += 1;
      if (game.phase === "deal" || game.phase === "executed" || game.phase === "no-execution") startNight(game);
      else if (game.phase === "night") resolveNight(game);
      else if (game.phase === "morning") startDay(game);
      else if (game.phase === "day") {
        flushDayScript(game);
        startVotingRound(game);
      } else if (game.phase === "revote") startVotingRound(game, game.revoteCandidates);
      else if (game.phase === "vote") {
        fillMissingVotes(game);
        resolveVotingRound(game);
      } else if (game.phase === "end") break;
      else throw new Error("進行不能: " + game.phase);
    }
    return game;
  }

  function matesOf(game, player) {
    return (player.memory.mates || []).map((id) => getPlayer(game, id));
  }

  function markMediumRead(player) {
    player.memory.medium.forEach((row) => {
      row.fresh = false;
    });
  }

  return {
    ROLE_META,
    ROLE_ORDER,
    blankComposition,
    recommendedComposition,
    validateComposition,
    compositionText,
    sumComposition,
    createGame,
    livingPlayers,
    livingHumans,
    getPlayer,
    findByName,
    roleName,
    resultLabel,
    causeLabel,
    winnerTitle,
    humanNightTurns,
    nightOptions,
    guardChoices,
    divinePreview,
    startNight,
    resolveNight,
    startDay,
    flushDayScript,
    commitScriptLine,
    humanTalk,
    declareIntent,
    humanComingOut,
    describeClaim,
    startVotingRound,
    castVote,
    resolveVotingRound,
    currentCandidates,
    missingVoters,
    runToEnd,
    judge,
    matesOf,
    markMediumRead,
    statementsKey,
    winningPlayers,
  };
})();

globalThis.Jinro = Jinro;
