import { clamp, overlap } from "./util";

export function compatibility(user, character) {
  const personality = overlap(user.personality, character.personality);
  const hobbies = overlap(user.hobbies, character.hobbies);
  const values = overlap(user.values, character.values);
  const idealHit = overlap(user.ideal, character.personality);
  const theyLike = overlap(character.ideal, user.personality);

  const raw =
    36 +
    personality.length * 6 +
    hobbies.length * 8 +
    values.length * 8 +
    idealHit.length * 7 +
    theyLike.length * 4 +
    (character.bias || 0);

  const score = clamp(Math.round(raw), 30, 97);
  const meter = (count, step, base) => clamp(base + count * step, 18, 99);

  return {
    score,
    breakdown: [
      { label: "性格", value: meter(personality.length, 20, 34) },
      { label: "趣味", value: meter(hobbies.length, 22, 28) },
      { label: "価値観", value: meter(values.length, 24, 26) },
      { label: "理想のタイプ", value: meter(idealHit.length + theyLike.length, 14, 30) },
    ],
    shared: { personality, hobbies, values, idealHit },
  };
}

export function initialAffection(score) {
  return clamp(Math.round(score * 0.22), 8, 26);
}

export function relationLabel(affection) {
  if (affection >= 90) return "特別";
  if (affection >= 75) return "気になる";
  if (affection >= 40) return "話しやすい";
  return "はじめまして";
}

export function scoreTone(score) {
  if (score >= 80) return "tone-high";
  if (score >= 62) return "tone-mid";
  return "tone-low";
}
