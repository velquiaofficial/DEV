(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.HaaScore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function settleActor({ actorIndex, assignment, votes, voterIndexes }) {
    const detail = [];
    const gain = {};
    let actorPts = 0;
    let sceneCount = 0;
    let bothCount = 0;
    let beatCount = 0;

    voterIndexes.forEach(function (vi) {
      const vote = votes[vi] || null;
      const sceneOk = !!(vote && vote.situationIndex === assignment.situationIndex);
      const tempOk = !!(sceneOk && vote.tempId && vote.tempId === assignment.tempId);
      const beatOk = !!(sceneOk && vote.beatId && vote.beatId === assignment.beatId);
      let pts = 0;
      if (sceneOk) {
        pts += 1;
        actorPts += 1;
        sceneCount += 1;
      }
      if (tempOk) {
        pts += 1;
        actorPts += 1;
        bothCount += 1;
      }
      if (beatOk) {
        pts += 1;
        actorPts += 1;
        beatCount += 1;
      }
      gain[vi] = pts;
      detail.push({
        playerIndex: vi,
        pickIndex: vote ? vote.situationIndex : null,
        pickTemp: vote ? vote.tempId : null,
        pickBeat: vote ? vote.beatId : null,
        sceneOk: sceneOk,
        tempOk: tempOk,
        beatOk: beatOk,
        pts: pts,
      });
    });

    gain[actorIndex] = (gain[actorIndex] || 0) + actorPts;
    return {
      actorPts: actorPts,
      detail: detail,
      gain: gain,
      sceneCount: sceneCount,
      bothCount: bothCount,
      beatCount: beatCount,
      voterCount: voterIndexes.length,
    };
  }

  return { settleActor: settleActor };
});

if (typeof module !== "undefined" && require.main === module) {
  const settleActor = module.exports.settleActor;
  const result = settleActor({
    actorIndex: 0,
    assignment: { situationIndex: 1, tempId: "warm" },
    votes: {
      1: { situationIndex: 1, tempId: "warm" },
      2: { situationIndex: 1, tempId: null },
      3: { situationIndex: 0, tempId: "warm" },
    },
    voterIndexes: [1, 2, 3],
  });

  function assert(cond, msg) {
    if (!cond) throw new Error(msg);
  }

  assert(result.gain[1] === 2, "both should be 2");
  assert(result.gain[2] === 1, "scene only should be 1");
  assert(result.gain[3] === 0, "temp without scene should be 0");
  assert(result.gain[0] === 3, "actor should be 3");
  assert(result.sceneCount === 2, "two scenes");
  assert(result.bothCount === 1, "one both");
  assert(result.beatCount === 0, "no beat in the first case");

  const withBeat = settleActor({
    actorIndex: 0,
    assignment: { situationIndex: 1, tempId: "warm", beatId: "beat" },
    votes: {
      1: { situationIndex: 1, tempId: null, beatId: "beat" },
      2: { situationIndex: 0, tempId: null, beatId: "beat" },
    },
    voterIndexes: [1, 2],
  });
  assert(withBeat.gain[1] === 2, "scene plus beat");
  assert(withBeat.gain[2] === 0, "beat without scene");
  assert(withBeat.gain[0] === 2, "actor scene plus beat");
  assert(withBeat.beatCount === 1, "one beat");
  console.log("score ok");
}
