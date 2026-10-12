"use strict";

/**
 * CPUの夜行動・カミングアウト・議論・投票。
 * 他人の役職は見ない。狼は仲間だけ、占い師は自分の結果だけを知っている。
 */
const JinroAI = (() => {
  const J = () => globalThis.Jinro;

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

  function claimsOf(game, extra) {
    return (game.claims || []).concat(extra || []);
  }

  function pressuresOf(game, extra) {
    return (game.pressures || []).concat(extra || []);
  }

  function voteHeat(game, playerId) {
    let heat = 0;
    (game.history.votes || []).forEach((round) => {
      (round.ballots || []).forEach((ballot) => {
        if (ballot.targetId === playerId) heat += 1;
      });
    });
    return heat;
  }

  function tilt(id, day) {
    const text = String(id) + ":" + String(day);
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
    return (hash % 100) / 100;
  }

  function emptyScores(game, viewerId) {
    const scores = {};
    J().livingPlayers(game).forEach((p) => {
      if (p.id !== viewerId) scores[p.id] = 0;
    });
    return scores;
  }

  function addScore(scores, id, amount) {
    if (!id || scores[id] == null) return;
    scores[id] += amount;
  }

  function suspicionMap(game, viewerId, extraClaims, extraPressures) {
    const scores = emptyScores(game, viewerId);
    const claims = claimsOf(game, extraClaims);
    const pressures = pressuresOf(game, extraPressures);
    Object.keys(scores).forEach((id) => {
      scores[id] += voteHeat(game, id) * 0.55;
      scores[id] += tilt(id, game.day) * 0.15;
    });
    const suspect = {};
    const defend = {};
    const selfDays = {};
    pressures.forEach((pressure) => {
      if (pressure.kind === "suspect") suspect[pressure.targetId] = (suspect[pressure.targetId] || 0) + 1.35;
      if (pressure.kind === "defend") defend[pressure.targetId] = (defend[pressure.targetId] || 0) - 1.15;
      if (pressure.kind === "self") selfDays[pressure.playerId] = (selfDays[pressure.playerId] || 0) + 1;
    });
    Object.keys(suspect).forEach((id) => addScore(scores, id, Math.min(4.2, suspect[id])));
    Object.keys(defend).forEach((id) => addScore(scores, id, Math.max(-2.4, defend[id])));
    Object.keys(selfDays).forEach((id) => addScore(scores, id, 1.65));

    const seerSlots = game.composition.seer || 0;
    const seerClaims = claims.filter((c) => c.role === "seer");
    if (seerSlots === 0) {
      seerClaims.forEach((claim) => addScore(scores, claim.playerId, 4));
    } else if (seerClaims.length === 1) {
      const claim = seerClaims[0];
      addScore(scores, claim.playerId, -0.8);
      claim.statements.forEach((statement) => {
        if (statement.result === "wolf") addScore(scores, statement.targetId, 6.2);
        else if (statement.result === "human") addScore(scores, statement.targetId, -3.2);
        else if (statement.result === "fox") addScore(scores, statement.targetId, 1);
      });
    } else if (seerClaims.length > 1) {
      seerClaims.forEach((claim) => {
        addScore(scores, claim.playerId, 3.2);
        claim.statements.forEach((statement) => {
          if (statement.result === "wolf") addScore(scores, statement.targetId, 1.6);
        });
      });
    }

    const mediumSlots = game.composition.medium || 0;
    const mediumClaims = claims.filter((c) => c.role === "medium");
    if (mediumSlots > 0 && mediumClaims.length === 1) {
      const medium = mediumClaims[0];
      medium.statements.forEach((statement) => {
        const expected = statement.role === "wolf" ? "wolf" : statement.role === "fox" ? "fox" : "human";
        seerClaims.forEach((claim) => {
          claim.statements.forEach((seerLine) => {
            if (seerLine.targetId !== statement.targetId) return;
            if (seerLine.result !== expected) addScore(scores, claim.playerId, 5.5);
          });
        });
      });
    } else if (mediumClaims.length > 1) {
      mediumClaims.forEach((claim) => addScore(scores, claim.playerId, 2.4));
    }

    const masonSlots = game.composition.mason || 0;
    const masonClaims = claims.filter((c) => c.role === "mason");
    if (masonSlots >= 2 && masonClaims.length > 0 && masonClaims.length <= masonSlots) {
      masonClaims.forEach((claim) => {
        (claim.statements || []).forEach((statement) => {
          const back = masonClaims.find((other) => {
            return other.playerId === statement.targetId && (other.statements || []).some((row) => row.targetId === claim.playerId);
          });
          if (!back) return;
          addScore(scores, claim.playerId, -3.4);
          addScore(scores, statement.targetId, -3.4);
        });
      });
    }
    return scores;
  }

  function bestId(game, scores) {
    let best = null;
    let value = -Infinity;
    let seat = Infinity;
    Object.keys(scores).forEach((id) => {
      const player = J().getPlayer(game, id);
      if (scores[id] > value || (scores[id] === value && player.seat < seat)) {
        value = scores[id];
        seat = player.seat;
        best = id;
      }
    });
    return best;
  }

  function worstId(game, scores) {
    let best = null;
    let value = Infinity;
    let seat = Infinity;
    Object.keys(scores).forEach((id) => {
      const player = J().getPlayer(game, id);
      if (scores[id] < value || (scores[id] === value && player.seat < seat)) {
        value = scores[id];
        seat = player.seat;
        best = id;
      }
    });
    return best;
  }

  function restrict(game, scores, candidateIds, selfId) {
    const allow = new Set(candidateIds);
    const out = {};
    candidateIds.forEach((id) => {
      if (id !== selfId && allow.has(id)) out[id] = scores[id] || 0;
    });
    return out;
  }

  function weightedPick(game, scores) {
    const entries = Object.keys(scores).map((id) => [id, scores[id] + Math.random() * 0.85]);
    if (!entries.length) return null;
    const min = Math.min.apply(null, entries.map((entry) => entry[1]));
    const weights = entries.map((entry) => [entry[0], Math.exp((entry[1] - min) * 0.75)]);
    let sum = 0;
    weights.forEach((entry) => {
      sum += entry[1];
    });
    let roll = Math.random() * sum;
    for (let i = 0; i < weights.length; i += 1) {
      roll -= weights[i][1];
      if (roll <= 0) return weights[i][0];
    }
    return weights[weights.length - 1][0];
  }

  function wolfMates(player) {
    const mates = new Set(player.memory.mates || []);
    mates.add(player.id);
    return mates;
  }

  function wolfScores(game, wolf, candidateIds, extraClaims) {
    const mates = wolfMates(wolf);
    const claims = claimsOf(game, extraClaims);
    const scores = {};
    const publicScores = suspicionMap(game, wolf.id, extraClaims, null);
    candidateIds.forEach((id) => {
      if (mates.has(id) || id === wolf.id) return;
      const player = game.players.find((p) => p.id === id && p.alive);
      if (!player) return;
      let score = 1 + tilt(id, game.day) * 0.4 + (publicScores[id] || 0) * 0.22;
      const seerClaim = claims.find((c) => c.playerId === id && c.role === "seer");
      const mediumClaim = claims.find((c) => c.playerId === id && c.role === "medium");
      const hunterClaim = claims.find((c) => c.playerId === id && c.role === "hunter");
      if (seerClaim) {
        score += 3.2;
        (seerClaim.statements || []).forEach((statement) => {
          if (!mates.has(statement.targetId)) return;
          if (statement.result === "wolf") score += 10;
          if (statement.result === "human") score -= 6;
        });
      }
      if (mediumClaim) score += 4;
      if (hunterClaim) score += 2;
      scores[id] = score;
    });
    return scores;
  }

  function wolfKillTarget(game) {
    const wolves = J().livingPlayers(game).filter((p) => p.role === "wolf");
    if (!wolves.length) return null;
    const prey = J().livingPlayers(game).filter((p) => p.role !== "wolf").map((p) => p.id);
    if (!prey.length) return null;
    return bestId(game, wolfScores(game, wolves[0], prey, null));
  }

  function seerTarget(game, seer) {
    const known = new Set((seer.memory.seer || []).map((row) => row.targetId));
    const options = J().livingPlayers(game).filter((p) => p.id !== seer.id);
    const unknown = options.filter((p) => !known.has(p.id));
    const pool = unknown.length ? unknown : options;
    if (!pool.length) return null;
    const scores = suspicionMap(game, seer.id, null, null);
    let best = pool[0];
    let value = -Infinity;
    pool.forEach((player) => {
      const score = (scores[player.id] || 0) + Math.random();
      if (score > value) {
        value = score;
        best = player;
      }
    });
    return best.id;
  }

  function hunterTarget(game, hunter) {
    const options = J().guardChoices(game, hunter);
    if (!options.length) return null;
    const seerClaims = (game.claims || []).filter((c) => c.role === "seer");
    if (seerClaims.length === 1) {
      const found = options.find((p) => p.id === seerClaims[0].playerId);
      if (found) return found.id;
    }
    const mediumClaims = (game.claims || []).filter((c) => c.role === "medium");
    if (mediumClaims.length === 1) {
      const found = options.find((p) => p.id === mediumClaims[0].playerId);
      if (found) return found.id;
    }
    return options[Math.floor(Math.random() * options.length)].id;
  }

  function cleanSeer(rows) {
    return (rows || []).map((row) => ({ day: row.day, targetId: row.targetId, result: row.result }));
  }

  function cleanMedium(rows) {
    return (rows || []).map((row) => ({ day: row.day, targetId: row.targetId, role: row.role }));
  }

  function already(game, playerId, role, statements) {
    const claim = (game.claims || []).find((c) => c.playerId === playerId && c.role === role);
    if (!claim) return false;
    return J().statementsKey(claim.statements) === J().statementsKey(statements);
  }

  function seerText(game, statements) {
    const bits = statements.map((statement) => {
      const name = J().getPlayer(game, statement.targetId).name;
      if (statement.result === "wolf") return statement.day + "日目の夜、" + name + "は人狼だった";
      if (statement.result === "fox") return statement.day + "日目の夜、" + name + "は妖狐だった。呪殺している";
      return statement.day + "日目の夜、" + name + "は人間だった";
    });
    return "占い師だ。" + bits.join("。") + "。";
  }

  function mediumText(game, statements) {
    const bits = statements.map((statement) => {
      const name = J().getPlayer(game, statement.targetId).name;
      return statement.day + "日目に吊られた" + name + "は" + J().roleName(statement.role) + "だった";
    });
    return "霊媒師だ。" + bits.join("。") + "。";
  }

  function nameOf(game, id) {
    return id ? J().getPlayer(game, id).name : "誰か";
  }

  function claimDetail(game, claim) {
    if (claim.role === "seer") {
      return (claim.statements || []).map((statement) => {
        const word = statement.result === "wolf" ? "黒" : statement.result === "fox" ? "妖狐" : "白";
        return nameOf(game, statement.targetId) + " " + word;
      }).join("、");
    }
    if (claim.role === "medium") {
      return (claim.statements || []).map((statement) => {
        return nameOf(game, statement.targetId) + " は " + J().roleName(statement.role);
      }).join("、");
    }
    if (claim.role === "mason") {
      return (claim.statements || []).map((statement) => "相方 " + nameOf(game, statement.targetId)).join("、");
    }
    return "";
  }

  function publicBoard(game, extraClaims, extraPressures) {
    const claims = claimsOf(game, extraClaims);
    const pressures = pressuresOf(game, extraPressures);
    const living = J().livingPlayers(game);
    const clashes = [];
    const seers = claims.filter((claim) => claim.role === "seer");
    const seerSlots = game.composition.seer || 0;
    if (seers.length > 1 && seers.length > seerSlots) clashes.push("占い師の宣言が配役より多い。偽が混ざっている。");
    else if (seers.length > 1) clashes.push("占い師を名乗る者が" + seers.length + "人いる。");
    claims.filter((claim) => claim.role === "medium").forEach((medium) => {
      (medium.statements || []).forEach((statement) => {
        const expected = statement.role === "wolf" ? "wolf" : statement.role === "fox" ? "fox" : "human";
        seers.forEach((seer) => {
          (seer.statements || []).forEach((line) => {
            if (line.targetId !== statement.targetId || line.result === expected) return;
            clashes.push(nameOf(game, seer.playerId) + "の占いと" + nameOf(game, medium.playerId) + "の霊媒が、" + nameOf(game, statement.targetId) + "で食い違っている。");
          });
        });
      });
    });
    const masons = claims.filter((claim) => claim.role === "mason");
    masons.forEach((claim) => {
      (claim.statements || []).forEach((statement) => {
        const back = masons.find((other) => {
          return other.playerId === statement.targetId && (other.statements || []).some((row) => row.targetId === claim.playerId);
        });
        if (back || !living.some((player) => player.id === statement.targetId)) return;
        clashes.push(nameOf(game, claim.playerId) + "は" + nameOf(game, statement.targetId) + "を相方と言ったが、相手からの宣言がない。");
      });
    });
    const weight = {};
    living.forEach((player) => {
      weight[player.id] = 0;
    });
    pressures.forEach((pressure) => {
      if (pressure.day != null && pressure.day !== game.day) return;
      if (pressure.kind === "suspect") weight[pressure.targetId] = (weight[pressure.targetId] || 0) + 2;
      if (pressure.kind === "defend" && weight[pressure.targetId] != null) weight[pressure.targetId] -= 1;
      if (pressure.kind === "self") weight[pressure.playerId] = (weight[pressure.playerId] || 0) + 2;
    });
    Object.keys(game.intents || {}).forEach((id) => {
      const target = game.intents[id];
      if (weight[target] != null) weight[target] += 3;
    });
    const leans = living
      .map((player) => ({ id: player.id, name: player.name, weight: weight[player.id] || 0 }))
      .filter((row) => row.weight > 0)
      .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name, "ja"))
      .slice(0, 3);
    return {
      claims: claims.map((claim) => ({
        playerId: claim.playerId,
        name: nameOf(game, claim.playerId),
        role: J().roleName(claim.role),
        roleId: claim.role,
        detail: claimDetail(game, claim),
      })),
      clashes: clashes.slice(0, 3),
      leans,
    };
  }

  function splitSeer(game, extraClaims, extraPressures) {
    const seers = claimsOf(game, extraClaims).filter((claim) => claim.role === "seer");
    if (seers.length < 2) return null;
    const scores = suspicionMap(game, null, extraClaims, extraPressures);
    let best = seers[0].playerId;
    let value = -Infinity;
    seers.forEach((claim) => {
      const score = scores[claim.playerId] || 0;
      if (score > value) {
        value = score;
        best = claim.playerId;
      }
    });
    return best;
  }

  function makeTalk(game, player, extraClaims, extraPressures) {
    if (player.role === "hanged") {
      const odd = [
        "今日は吊らずに散らした方が、あとで後悔しない気がする。",
        "根拠より、この空気の方が先に人を吊りそうで怖い。",
        "自分に票が集まるなら、それはそれでいい。",
      ];
      const text = odd[Math.floor(Math.random() * odd.length)];
      if (game.day >= 3) return { text, pressure: { targetId: player.id, kind: "self" } };
      return { text, pressure: null };
    }

    if (player.role === "mason") {
      const partnerId = (player.memory.mates || []).find((id) => {
        const mate = game.players.find((p) => p.id === id);
        return mate && mate.alive;
      });
      if (partnerId) {
        const scores = suspicionMap(game, player.id, extraClaims, extraPressures);
        if ((scores[partnerId] || 0) >= 3) {
          return {
            text: nameOf(game, partnerId) + "は共有者の相方だ。人狼ではない。",
            claim: { role: "mason", statements: [{ targetId: partnerId }] },
            pressure: { targetId: partnerId, kind: "defend" },
          };
        }
      }
    }

    if (player.role === "wolf") {
      const prey = J().livingPlayers(game).filter((p) => p.id !== player.id).map((p) => p.id);
      const scores = wolfScores(game, player, prey, extraClaims);
      const target = bestId(game, scores);
      if (!target) return { text: "今日は票を割らず、黒が出ている方へまとめたい。", pressure: null };
      const claimedSeer = claimsOf(game, extraClaims).find((claim) => claim.playerId === target && claim.role === "seer");
      const text = claimedSeer
        ? nameOf(game, target) + "の黒は、自分には信じられない。今日はこの占いを吊る。"
        : "迷うなら" + nameOf(game, target) + "だ。票はここにまとめる。";
      return {
        text,
        pressure: target ? { targetId: target, kind: "suspect" } : null,
        intent: target || null,
      };
    }

    if (player.role === "madman") {
      const rival = claimsOf(game, extraClaims).find((claim) => claim.role === "seer" && claim.playerId !== player.id);
      if (rival) {
        return {
          text: nameOf(game, rival.playerId) + "の占いは偽だ。今日の票はこちらに置く。",
          pressure: { targetId: rival.playerId, kind: "suspect" },
          intent: rival.playerId,
        };
      }
    }

    if (player.role === "fox") {
      const onMe = pressuresOf(game, extraPressures).some((pressure) => pressure.targetId === player.id && pressure.kind === "suspect");
      const scores = suspicionMap(game, player.id, extraClaims, extraPressures);
      const away = bestId(game, scores);
      if (onMe && away) {
        return {
          text: "自分を吊るのは早い。" + nameOf(game, away) + "の方が、今日は材料がある。",
          pressure: { targetId: away, kind: "suspect" },
          intent: away,
        };
      }
      return { text: "黒を一人に絞ってから吊りたい。灰のままの人を先に切ると、あとで戻れない。", pressure: null };
    }

    const rivalSeer = splitSeer(game, extraClaims, extraPressures);
    if (rivalSeer) {
      return {
        text: "占いが割れている。今日は" + nameOf(game, rivalSeer) + "の宣言から潰す。",
        pressure: { targetId: rivalSeer, kind: "suspect" },
        intent: rivalSeer,
      };
    }

    const board = publicBoard(game, extraClaims, extraPressures);
    if (board.clashes.length) {
      const scoresNow = suspicionMap(game, player.id, extraClaims, extraPressures);
      const targetNow = bestId(game, scoresNow);
      return {
        text: board.clashes[0] + (targetNow ? " 見るなら" + nameOf(game, targetNow) + "だ。" : ""),
        pressure: targetNow ? { targetId: targetNow, kind: "suspect" } : null,
        intent: targetNow || null,
      };
    }

    const scores = suspicionMap(game, player.id, extraClaims, extraPressures);
    const target = bestId(game, scores);
    const max = target ? scores[target] : 0;
    if (!target || max < 1.4) {
      const generic = [
        "まだ黒を吊れる材料が薄い。今日は根拠を揃えてからにしたい。",
        "昨夜の結果だけで一人を決めるのは早い。でも票は散らしたくない。",
        "静かな朝が続くと、守られたのか、襲えなかったのか、わからなくなる。",
      ];
      if (game.morningDeaths && game.morningDeaths.length && Math.random() < 0.55) {
        const dead = J().getPlayer(game, game.morningDeaths[0].playerId);
        return { text: dead.name + "がやられた。次に狙われそうな人から考えたい。", pressure: null };
      }
      return { text: generic[Math.floor(Math.random() * generic.length)], pressure: null };
    }
    const lead = [
      nameOf(game, target) + "が一番怪しい。今日の票はここに集めたい。",
      nameOf(game, target) + "の説明が、昨夜までの話と噛み合っていない。",
      "決めるなら" + nameOf(game, target) + "だと思う。",
    ];
    let text = lead[Math.floor(Math.random() * lead.length)];
    if (game.morningDeaths && game.morningDeaths.length && Math.random() < 0.34) {
      const dead = J().getPlayer(game, game.morningDeaths[0].playerId);
      text = dead.name + "を失ったあとで考えると、" + text;
    }
    return { text, pressure: { targetId: target, kind: "suspect" }, intent: target };
  }

  function pointOf(game, previous) {
    if (!previous || !previous.playerId) return null;
    const speaker = J().getPlayer(game, previous.playerId);
    const claim = previous.claim || null;
    const statement = claim && claim.statements && claim.statements[0] ? claim.statements[0] : null;
    let targetId = previous.intent || null;
    if (!targetId && previous.pressure && previous.pressure.kind === "suspect") targetId = previous.pressure.targetId;
    if (!targetId && previous.pressure && previous.pressure.kind === "self") targetId = previous.playerId;
    let result = null;
    let subjectId = null;
    let mediumRole = null;
    if (statement && claim.role === "seer") {
      subjectId = statement.targetId;
      result = statement.result;
      if (!targetId && result === "wolf") targetId = subjectId;
    }
    if (statement && claim.role === "medium") {
      subjectId = statement.targetId;
      mediumRole = statement.role;
    }
    if (statement && claim.role === "mason" && !targetId) subjectId = statement.targetId;
    if (!subjectId && previous.pressure && previous.pressure.kind === "defend") subjectId = previous.pressure.targetId;
    return { speaker, targetId, claim, result, subjectId, mediumRole, pressure: previous.pressure || null, text: previous.text || "" };
  }

  function claimQueued(game, playerId, role) {
    return (game.dayScript || []).some((line) => line.playerId === playerId && line.claim && line.claim.role === role);
  }

  function preferredTarget(game, player, extraClaims) {
    if (player.role === "wolf") {
      const prey = J().livingPlayers(game).filter((p) => p.id !== player.id).map((p) => p.id);
      return bestId(game, wolfScores(game, player, prey, extraClaims));
    }
    if (player.role === "madman") {
      const rival = claimsOf(game, extraClaims).find((claim) => claim.role === "seer" && claim.playerId !== player.id);
      return rival ? rival.playerId : null;
    }
    if (player.role === "seer") {
      const black = (player.memory.seer || []).find((row) => row.result === "wolf");
      if (black && J().livingPlayers(game).some((p) => p.id === black.targetId)) return black.targetId;
    }
    const rival = splitSeer(game, extraClaims, null);
    if (rival && rival !== player.id) return rival;
    const scores = suspicionMap(game, player.id, extraClaims, null);
    const top = bestId(game, scores);
    return top && scores[top] >= 1.4 ? top : null;
  }

  function follow(game, player, previous, extraClaims) {
    const point = pointOf(game, previous);
    if (!point) return makeTalk(game, player, extraClaims, null);
    const who = point.speaker.name;
    const them = point.targetId && point.targetId !== player.id ? nameOf(game, point.targetId) : "";
    const callingMe = point.targetId === player.id;
    const seerHit = point.claim && point.claim.role === "seer"
      ? (point.claim.statements || []).find((row) => row.targetId === player.id)
      : null;

    if (player.role === "seer" && player.memory.seer.length && !already(game, player.id, "seer", cleanSeer(player.memory.seer)) && !claimQueued(game, player.id, "seer")) {
      const statements = cleanSeer(player.memory.seer);
      return {
        text: who + "の話は聞いた。" + seerText(game, statements),
        claim: { role: "seer", statements },
        pressure: statements[0] && statements[0].result === "wolf" ? { targetId: statements[0].targetId, kind: "suspect" } : null,
        intent: statements[0] && statements[0].result === "wolf" ? statements[0].targetId : null,
      };
    }

    if (seerHit && seerHit.result === "wolf") {
      if (player.role === "wolf") {
        return {
          text: who + "、その黒は認めない。偽の占いだ。今日は" + who + "を吊る。",
          pressure: { targetId: point.speaker.id, kind: "suspect" },
          intent: point.speaker.id,
        };
      }
      if (player.role === "hanged") {
        return { text: who + "が自分を黒にした。吊られるなら、それでもいい。", pressure: { targetId: player.id, kind: "self" } };
      }
      return { text: who + "、自分は人狼ではない。その黒は、別の占いと照らしてほしい。", pressure: null };
    }

    if (player.role === "wolf" && point.targetId && wolfMates(player).has(point.targetId)) {
      const decoy = preferredTarget(game, player, extraClaims);
      return {
        text: who + "、" + them + "を吊る根拠が弱い。" + (decoy ? "自分は" + nameOf(game, decoy) + "を見ている。" : ""),
        pressure: decoy ? { targetId: decoy, kind: "suspect" } : { targetId: point.targetId, kind: "defend" },
        intent: decoy || null,
      };
    }

    if (callingMe) {
      if (player.role === "wolf") {
        const decoy = preferredTarget(game, player, extraClaims);
        return {
          text: who + "、自分は人狼ではない。" + (decoy ? "見るなら" + nameOf(game, decoy) + "だ。" : ""),
          pressure: decoy ? { targetId: decoy, kind: "suspect" } : null,
          intent: decoy || null,
        };
      }
      if (player.role === "hanged" && game.day >= 2) {
        return { text: who + "が自分を挙げるなら、止めない。", pressure: { targetId: player.id, kind: "self" } };
      }
      if (player.role === "seer" && player.memory.seer.length) {
        const last = player.memory.seer[player.memory.seer.length - 1];
        const word = last.result === "wolf" ? "黒" : last.result === "fox" ? "妖狐" : "白";
        return {
          text: who + "、占いは変えない。" + nameOf(game, last.targetId) + "は" + word + "だ。",
          pressure: last.result === "human" ? { targetId: last.targetId, kind: "defend" } : { targetId: last.targetId, kind: "suspect" },
          intent: last.result === "wolf" ? last.targetId : null,
        };
      }
      return { text: who + "、自分を吊るなら、占いか霊媒の結果を先に出してほしい。", pressure: null };
    }

    if (player.role === "madman" && point.claim && point.claim.role === "seer" && point.claim.playerId !== player.id) {
      return {
        text: who + "の占いは偽だ。今日の票は" + who + "に置く。",
        pressure: { targetId: point.speaker.id, kind: "suspect" },
        intent: point.speaker.id,
      };
    }

    if (player.role === "seer" && point.claim && point.claim.role === "seer" && point.claim.playerId !== player.id) {
      const last = player.memory.seer[player.memory.seer.length - 1];
      const word = last ? (last.result === "wolf" ? "黒" : last.result === "fox" ? "妖狐" : "白") : "";
      const mine = last ? nameOf(game, last.targetId) + "は" + word : "結果は変えない";
      return {
        text: who + "の占いとは結果が違う。自分は" + mine + "。今日は" + who + "を疑う。",
        pressure: { targetId: point.speaker.id, kind: "suspect" },
        intent: point.speaker.id,
      };
    }

    if (point.mediumRole && point.subjectId) {
      const deadName = nameOf(game, point.subjectId);
      const roleLabel = J().roleName(point.mediumRole);
      if (player.role === "wolf" && wolfMates(player).has(point.subjectId) && point.mediumRole === "wolf") {
        return {
          text: who + "の霊媒は認めない。" + deadName + "が人狼だったとは言えない。今日は" + who + "を疑う。",
          pressure: { targetId: point.speaker.id, kind: "suspect" },
          intent: point.speaker.id,
        };
      }
      return { text: who + "が、吊られた" + deadName + "は" + roleLabel + "だと言う。この霊媒を、占いと照らそう。", pressure: null };
    }

    if (point.result === "human" && point.subjectId) {
      const subject = nameOf(game, point.subjectId);
      if (player.role === "hanged") {
        return { text: who + "が" + subject + "を白と言うのは聞いた。自分は、吊られても構わない。", pressure: game.day >= 3 ? { targetId: player.id, kind: "self" } : null };
      }
      if (player.id === point.subjectId) {
        return { text: who + "が自分を白と言った。今日の吊り先からは、自分を外してほしい。", pressure: { targetId: player.id, kind: "defend" } };
      }
      const next = preferredTarget(game, player, extraClaims);
      const hop = next && next !== point.subjectId ? "自分は" + nameOf(game, next) + "を見ている。" : "黒が出るまで、吊り先は決めない。";
      return {
        text: who + "が" + subject + "を白と言うなら、" + subject + "は今日外す。" + hop,
        pressure: next && next !== point.subjectId ? { targetId: next, kind: "suspect" } : { targetId: point.subjectId, kind: "defend" },
        intent: next && next !== point.subjectId ? next : null,
      };
    }

    if (point.pressure && point.pressure.kind === "self") {
      const next = preferredTarget(game, player, extraClaims);
      if (next && next !== point.speaker.id && player.role !== "hanged") {
        return {
          text: who + "が自分を吊れと言う。覚えておく。ただ自分の票は" + nameOf(game, next) + "だ。",
          pressure: { targetId: next, kind: "suspect" },
          intent: next,
        };
      }
      return {
        text: who + "が自分を挙げた。ほかに黒がないなら、今日は" + who + "でもいい。",
        pressure: { targetId: point.speaker.id, kind: "suspect" },
        intent: point.speaker.id,
      };
    }

    if (!point.targetId && point.pressure && point.pressure.kind === "defend" && point.subjectId) {
      const subject = point.subjectId === point.speaker.id ? "自分" : nameOf(game, point.subjectId);
      const next = preferredTarget(game, player, extraClaims);
      if (player.role === "hanged") {
        return { text: who + "が" + subject + "を外したいのは聞いた。自分は、吊られても構わない。", pressure: game.day >= 3 ? { targetId: player.id, kind: "self" } : null };
      }
      if (next && next !== point.subjectId) {
        return {
          text: who + "が" + subject + "を外すなら、自分は" + nameOf(game, next) + "を置く。",
          pressure: { targetId: next, kind: "suspect" },
          intent: next,
        };
      }
      return { text: who + "が" + subject + "を外すのは聞いた。代わりの名前は、黒が出てからにする。", pressure: null };
    }

    const mine = preferredTarget(game, player, extraClaims);
    if (player.role === "hanged") {
      return { text: who + (them ? "は" + them + "と言う。" : "の話は聞いた。") + "自分は、吊られても構わない。", pressure: game.day >= 3 ? { targetId: player.id, kind: "self" } : null };
    }
    if (player.role === "fox" && (mine === player.id || point.targetId === player.id)) {
      return { text: who + "の話は聞いた。自分より、根拠のある人を先に吊りたい。", pressure: null };
    }
    if (them && mine === point.targetId) {
      return {
        text: who + "に同意する。" + them + "を今日吊る。",
        pressure: { targetId: point.targetId, kind: "suspect" },
        intent: point.targetId,
      };
    }
    if (them && mine && mine !== point.targetId) {
      return {
        text: who + "の" + them + "には、まだ乗らない。自分は" + nameOf(game, mine) + "を見ている。",
        pressure: { targetId: mine, kind: "suspect" },
        intent: mine,
      };
    }
    if (them && point.pressure && point.pressure.kind === "defend") {
      return { text: who + "は" + them + "を庇った。その白が本当なら、今日は外そう。", pressure: { targetId: point.targetId, kind: "defend" } };
    }
    if (!them) {
      const next = preferredTarget(game, player, extraClaims);
      if (player.role === "seer" && player.memory.seer.length) {
        const last = player.memory.seer[player.memory.seer.length - 1];
        const word = last.result === "wolf" ? "黒" : last.result === "fox" ? "妖狐" : "白";
        const next = preferredTarget(game, player, extraClaims);
        const extra = next && next !== last.targetId ? "今日は" + nameOf(game, next) + "を疑う。" : "";
        return {
          text: who + "の問いに答える。占いでは" + nameOf(game, last.targetId) + "は" + word + "だ。" + extra,
          pressure: next ? { targetId: next, kind: next === last.targetId && last.result === "human" ? "defend" : "suspect" } : null,
          intent: next && !(last.result === "human" && next === last.targetId) ? next : null,
        };
      }
      if (next && player.role !== "hanged" && player.role !== "fox") {
        return {
          text: who + "の問いに答える。根拠は薄いが、仮に置くなら" + nameOf(game, next) + "だ。",
          pressure: { targetId: next, kind: "suspect" },
          intent: next,
        };
      }
      return { text: who + "の質問には、まだ名前で答えられない。黒か、食い違う占いが出てからにする。", pressure: null };
    }
    return {
      text: who + "が" + them + "と言うなら、自分も" + them + "に置く。反対なら、別の名前を出してほしい。",
      pressure: { targetId: point.targetId, kind: "suspect" },
      intent: point.targetId,
    };
  }

  function lineFrom(player, talk) {
    return {
      playerId: player.id,
      text: talk.text,
      claim: talk.claim || null,
      pressure: talk.pressure || null,
      intent: talk.intent || null,
    };
  }

  function carriedClaim(line) {
    if (!line || !line.claim) return null;
    return { playerId: line.playerId, role: line.claim.role, statements: line.claim.statements };
  }

  function continueThread(game, previous, pending, skipIds, extras) {
    const carried = (extras || []).slice();
    const out = [];
    let anchor = previous;
    (pending || []).forEach((line) => {
      if (line.claim) {
        out.push(line);
        anchor = line;
        const row = carriedClaim(line);
        if (row) carried.push(row);
        return;
      }
      if (skipIds && skipIds.has(line.playerId)) return;
      const player = J().getPlayer(game, line.playerId);
      if (!player || !player.alive || !player.isCpu) return;
      const talk = follow(game, player, anchor, carried);
      const next = lineFrom(player, talk);
      out.push(next);
      anchor = next;
      const row = carriedClaim(next);
      if (row) carried.push(row);
    });
    return out;
  }

  function buildDayScript(game) {
    const lines = [];
    const alive = J().livingPlayers(game).filter((p) => p.isCpu);

    alive.filter((p) => p.role === "seer" && p.memory.seer.length).forEach((seer) => {
      const statements = cleanSeer(seer.memory.seer);
      if (already(game, seer.id, "seer", statements)) return;
      lines.push({ playerId: seer.id, text: seerText(game, statements), claim: { role: "seer", statements } });
    });

    if (game.day === 1 && (game.composition.seer || 0) === 1) {
      alive.filter((p) => p.role === "madman").forEach((mad) => {
        if (Math.random() > 0.62) return;
        if (lines.some((line) => line.playerId === mad.id && line.claim)) return;
        const options = J().livingPlayers(game).filter((p) => p.id !== mad.id);
        if (!options.length) return;
        const prior = lines.filter((line) => line.claim && line.claim.role === "seer").slice(-1)[0];
        const banned = new Set([mad.id]);
        if (prior && prior.claim.statements[0]) banned.add(prior.claim.statements[0].targetId);
        const pool = options.filter((p) => !banned.has(p.id));
        const target = (pool.length ? pool : options)[Math.floor(Math.random() * (pool.length ? pool.length : options.length))];
        const statements = [{ day: game.day, targetId: target.id, result: "wolf" }];
        const counter = prior ? nameOf(game, prior.playerId) + "の結果は認めない。" : "";
        lines.push({
          playerId: mad.id,
          text: "占い師だ。" + counter + game.day + "日目の夜、" + target.name + "は人狼だった。",
          claim: { role: "seer", statements },
        });
      });
    }

    alive.filter((p) => p.role === "medium" && p.memory.medium.length).forEach((medium) => {
      const statements = cleanMedium(medium.memory.medium);
      if (already(game, medium.id, "medium", statements)) return;
      lines.push({ playerId: medium.id, text: mediumText(game, statements), claim: { role: "medium", statements } });
    });

    const mediumAlive = J().livingPlayers(game).some((p) => p.role === "medium");
    if (!mediumAlive && (game.composition.medium || 0) > 0 && game.lastExecuted && game.lastExecuted.seen) {
      const wolf = alive.find((p) => p.role === "wolf" && !lines.some((line) => line.playerId === p.id && line.claim));
      if (wolf && Math.random() < 0.45) {
        const executed = J().getPlayer(game, game.lastExecuted.playerId);
        const mates = wolfMates(wolf);
        let lie = "villager";
        if (mates.has(executed.id)) lie = "villager";
        else lie = Math.random() < 0.75 ? "villager" : "wolf";
        const statements = [{ day: game.lastExecuted.day, targetId: executed.id, role: lie }];
        lines.push({ playerId: wolf.id, text: mediumText(game, statements), claim: { role: "medium", statements } });
      }
    }

    const pendingClaims = lines.filter((line) => line.claim).map((line) => ({
      playerId: line.playerId,
      role: line.claim.role,
      statements: line.claim.statements,
    }));
    const spoken = new Set(lines.map((line) => line.playerId));
    const remaining = alive.filter((player) => !spoken.has(player.id));
    const lastSeer = lines.filter((line) => line.claim && line.claim.role === "seer").slice(-1)[0];
    const accusedId = lastSeer && lastSeer.claim.statements[0] ? lastSeer.claim.statements[0].targetId : "";
    remaining.sort((a, b) => (a.id === accusedId ? -1 : 0) - (b.id === accusedId ? -1 : 0));
    let previous = lines[lines.length - 1] || null;
    if (!lastSeer && (game.composition.seer || 0) > 0 && remaining.length) {
      const asker = remaining.shift();
      const text = "占い師がいるなら、先に結果を聞かせてほしい。隠したままだと、誰を吊るか話せない。";
      lines.push({ playerId: asker.id, text });
      previous = { playerId: asker.id, text };
    }
    remaining.slice(0, 2).forEach((player) => {
      const talk = follow(game, player, previous, pendingClaims);
      if (talk.claim) pendingClaims.push({ playerId: player.id, role: talk.claim.role, statements: talk.claim.statements });
      const next = lineFrom(player, talk);
      lines.push(next);
      previous = next;
    });
    return lines;
  }

  function reactionSentence(game, speaker, claim) {
    const target = claim.statements && claim.statements[0] ? claim.statements[0] : null;
    if (claim.role === "seer" && target) {
      const who = nameOf(game, target.targetId);
      if (speaker.role === "wolf") {
        const mates = wolfMates(speaker);
        if (target.result === "wolf" && mates.has(target.targetId)) {
          return nameOf(game, claim.playerId) + "の黒は認めない。偽占いの線を先に潰したい。";
        }
        return "その占い、本当に信じていいのか。別の見方もある。";
      }
      if (target.result === "wolf") return who + "が黒なら、今日の投票は重い。理由を崩せる人はいるか。";
      if (target.result === "fox") return who + "が妖狐だったなら、その占いは本物の可能性が高い。";
      return who + "が白なら、今日の吊り先からは一度外したい。";
    }
    if (claim.role === "medium") return "霊媒の結果は、占いと照らさないと危険だ。";
    if (claim.role === "mason") return "共有の宣言は、相方の反応も見てから信じたい。";
    if (claim.role === "hunter") return "狩人を名乗るなら、昨夜誰を守ったのかは聞かないでおく。";
    return "カミングアウトは聞いた。票の前に、一度整理したい。";
  }

  function reactToClaim(game, claim) {
    const pending = (game.dayScript || []).filter((line) => line.reaction).length;
    if (pending >= 3) return [];
    const targetId = claim.statements && claim.statements[0] ? claim.statements[0].targetId : null;
    let previous = { playerId: claim.playerId, text: "", claim, intent: targetId, pressure: targetId ? { targetId, kind: "suspect" } : null };
    const ordered = [];
    const focus = targetId ? game.players.find((p) => p.id === targetId && p.alive) : null;
    if (focus && focus.isCpu && focus.id !== claim.playerId) ordered.push(focus);
    shuffle(J().livingPlayers(game).filter((p) => p.isCpu && p.id !== claim.playerId && (!focus || p.id !== focus.id))).forEach((player) => {
      ordered.push(player);
    });
    const out = [];
    ordered.slice(0, 1).forEach((player) => {
      const talk = follow(game, player, previous, [claim]);
      const next = lineFrom(player, talk);
      next.reaction = true;
      out.push(next);
      previous = next;
    });
    return out;
  }

  function reactToTalk(game, playerId, text, pressure) {
    const pending = (game.dayScript || []).filter((line) => line.reaction).length;
    if (pending >= 4) return [];
    const speaker = J().getPlayer(game, playerId);
    const body = (text || "").trim();
    const mentioned = J().livingPlayers(game).filter((player) => player.id !== playerId && body.indexOf(player.name) >= 0);
    const focusId = (pressure && pressure.targetId) || (mentioned[0] && mentioned[0].id) || null;
    let previous = {
      playerId,
      text: body,
      pressure: pressure || (focusId ? { targetId: focusId, kind: "suspect" } : null),
      intent: pressure && pressure.kind === "suspect" ? pressure.targetId : focusId,
    };
    const ordered = [];
    const focus = focusId ? J().getPlayer(game, focusId) : null;
    const pool = J().livingPlayers(game).filter((player) => player.isCpu && player.id !== playerId);
    if (focus && focus.isCpu && focus.alive && focus.id !== playerId) ordered.push(focus);
    const informed = pool.find((player) => player.role === "seer" && player.memory.seer.length && !ordered.some((row) => row.id === player.id));
    if (informed) ordered.push(informed);
    shuffle(pool.filter((player) => !ordered.some((row) => row.id === player.id))).forEach((player) => {
      ordered.push(player);
    });
    const out = [];
    ordered.slice(0, 1).forEach((player) => {
      const talk = follow(game, player, previous, null);
      if (player.role === "seer" && player.memory.seer.length && !talk.claim && !already(game, player.id, "seer", cleanSeer(player.memory.seer))) {
        talk.claim = { role: "seer", statements: cleanSeer(player.memory.seer) };
      }
      const next = lineFrom(player, talk);
      next.reaction = true;
      out.push(next);
      previous = next;
    });
    return out;
  }

  function rethread(game, previous, skipIds, carriedClaims) {
    const pending = (game.dayScript || []).filter((line) => !line.reaction);
    const claims = pending.filter((line) => line.claim);
    const opinions = pending.filter((line) => !line.claim);
    const carried = (carriedClaims || []).slice();
    let anchor = previous;
    const out = [];
    claims.forEach((line) => {
      if (skipIds && skipIds.has(line.playerId)) return;
      out.push(line);
      anchor = line;
      const row = carriedClaim(line);
      if (row) carried.push(row);
    });
    return out.concat(continueThread(game, anchor, opinions, skipIds, carried));
  }

  function chooseVote(game, player, candidateIds) {
    const legal = (candidateIds || []).filter((id) => id && id !== player.id && game.players.some((p) => p.id === id && p.alive));
    if (!legal.length) return null;
    const said = game.intents && game.intents[player.id];
    if (said && legal.indexOf(said) >= 0) return said;
    let picked = null;
    if (player.role === "wolf") {
      if (!game._wolfBloc || legal.indexOf(game._wolfBloc) < 0) {
        const scores = wolfScores(game, player, legal, null);
        game._wolfBloc = bestId(game, scores);
      }
      picked = game._wolfBloc;
    } else if (player.role === "madman") {
      const seerClaims = (game.claims || []).filter((c) => c.role === "seer" && legal.indexOf(c.playerId) >= 0);
      if (seerClaims.length === 1) picked = seerClaims[0].playerId;
      else {
        const scores = suspicionMap(game, player.id, null, null);
        const whites = [];
        (game.claims || []).forEach((claim) => {
          if (claim.role !== "seer") return;
          (claim.statements || []).forEach((statement) => {
            if (statement.result === "human" && legal.indexOf(statement.targetId) >= 0) whites.push(statement.targetId);
          });
        });
        picked = whites[0] || worstId(game, restrict(game, scores, legal, player.id));
      }
    } else if (player.role === "hanged") {
      const scores = restrict(game, suspicionMap(game, player.id, null, null), legal, player.id);
      picked = worstId(game, scores);
    } else if (player.role === "fox") {
      const scores = restrict(game, suspicionMap(game, player.id, null, null), legal, player.id);
      picked = bestId(game, scores);
    } else {
      const scores = restrict(game, suspicionMap(game, player.id, null, null), legal, player.id);
      picked = weightedPick(game, scores);
    }
    if (!picked || legal.indexOf(picked) < 0 || picked === player.id) return legal[0];
    return picked;
  }

  return {
    wolfKillTarget,
    seerTarget,
    hunterTarget,
    buildDayScript,
    reactToClaim,
    reactToTalk,
    rethread,
    chooseVote,
    suspicionMap,
    publicBoard,
  };
})();

globalThis.JinroAI = JinroAI;
