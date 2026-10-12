import { HOBBIES, PERSONALITY, VALUES } from "../data/options";
import { clamp, fill, makeEcho, pickDifferent } from "./util";

const ALIASES = [
  { tag: "カフェ", words: ["カフェ", "コーヒー", "珈琲", "ラテ"] },
  { tag: "映画", words: ["映画", "シネマ"] },
  { tag: "料理", words: ["料理", "自炊", "レシピ"] },
  { tag: "読書", words: ["読書", "小説", "漫画", "マンガ"] },
  { tag: "アート", words: ["アート", "美術館", "イラスト", "絵画"] },
  { tag: "ワイン", words: ["ワイン"] },
  { tag: "音楽", words: ["音楽", "ライブ", "バンド"] },
  { tag: "写真", words: ["写真", "カメラ", "撮影"] },
  { tag: "海", words: ["海辺", "ビーチ", "湘南"] },
  { tag: "旅行", words: ["旅行", "海外"] },
  { tag: "ランニング", words: ["ランニング", "ジョギング"] },
  { tag: "ラーメン", words: ["ラーメン", "らーめん"] },
  { tag: "ゲーム", words: ["ゲーム"] },
  { tag: "ボードゲーム", words: ["ボードゲーム", "ボドゲ"] },
  { tag: "筋トレ", words: ["筋トレ", "ジム", "トレーニング"] },
  { tag: "キャンプ", words: ["キャンプ", "焚き火"] },
  { tag: "サウナ", words: ["サウナ"] },
  { tag: "植物", words: ["植物", "観葉"] },
  { tag: "ファッション", words: ["ファッション", "コーデ"] },
  ...VALUES.map((tag) => ({ tag, words: [tag] })),
  ...PERSONALITY.map((tag) => ({ tag, words: [tag] })),
];

const FLAT = ALIASES.flatMap((entry) => entry.words.map((word) => ({ tag: entry.tag, word }))).sort(
  (a, b) => b.word.length - a.word.length,
);

function mentionsSea(text) {
  return /海(?!外)/.test(text);
}

export function detectTag(message) {
  const text = String(message || "");
  const hit = FLAT.find((entry) => text.includes(entry.word));
  if (hit) return hit.tag;
  if (mentionsSea(text)) return "海";
  return null;
}

function detectIntent(text) {
  if (/うざ|きもい|きも|死ね|だまれ|黙れ|消えろ/.test(text)) return "rude";
  if (/相性|好感度/.test(text)) return "chemistry";
  if (/会いたい|デート|ご飯行|ごはん行|遊ぼう|遊ぼ|会おう|会いません/.test(text)) return "date";
  if (/恋愛|付き合う|結婚|理想のタイプ|好きなタイプ|恋人/.test(text)) return "love";
  if (/仕事|職業|働いて|お仕事|何してる人/.test(text)) return "work";
  if (/元気|調子どう|調子は/.test(text)) return "mood";
  if (/ありがとう/.test(text)) return "thanks";
  if (/ばいばい|さようなら|おやすみ|またね|じゃあね/.test(text)) return "bye";
  if (/^(こんにちは|こんばんは|おはよう|やあ|やあ！|ハロー|hello|hi)[！!。.\s]*$/i.test(text)) return "greet";
  if (/^(好き|大好き|かわいい|可愛い|かっこいい|素敵)[！!。.\s]*$/.test(text)) return "compliment";
  if (/可愛い|かわいい|かっこいい|格好いい|素敵だね|素敵です|美人|イケメン|タイプだ|あなたが好き|のこと好き|君が好き/.test(text)) {
    return "compliment";
  }
  if ((/笑|ｗ|ww|草/.test(text) || /面白い/.test(text)) && text.length < 28) return "laugh";
  if (text.length <= 3) return "short";
  if (/[？?]/.test(text) || /教えて|どうして|なぜ/.test(text)) return "ask";
  return null;
}

function shares(user, character, tag) {
  const userTags = [...(user.hobbies || []), ...(user.values || []), ...(user.personality || []), ...(user.ideal || [])];
  const characterTags = [
    ...(character.hobbies || []),
    ...(character.values || []),
    ...(character.personality || []),
    ...(character.ideal || []),
  ];
  return userTags.includes(tag) && characterTags.includes(tag);
}

function deltaFor(intent, message) {
  const table = {
    greet: 2,
    mood: 3,
    topic: 4,
    work: 4,
    love: 5,
    date: 6,
    compliment: 6,
    thanks: 2,
    laugh: 3,
    ask: 3,
    chat: 3,
    short: 1,
    chemistry: 3,
    bye: 1,
    rude: -6,
  };
  let delta = table[intent] ?? 3;
  if (/好き|嬉し|楽し|最高|わかる|同じ|素敵|面白/.test(message)) delta += 1;
  if (message.length > 48) delta += 1;
  return delta;
}

export function openingMessage(character, user, comp) {
  const ctx = {
    name: user.name || "あなた",
    score: comp.score,
    topic: "",
  };
  const shared =
    (user.hobbies || []).find((item) => character.hobbies.includes(item)) ||
    (user.values || []).find((item) => character.values.includes(item)) ||
    "";
  const base = fill(pickDifferent(character.openers, `${character.id}:${user.name}`, ""), ctx);
  if (!shared) return base;
  ctx.topic = shared;
  return `${base}\n${fill(character.openerShared, ctx)}`;
}

export function createReply({ character, user, history, message, affection, score = "" }) {
  const textIn = String(message || "").trim();
  const lastAi = [...history].reverse().find((item) => item.role === "ai")?.text || "";
  const salt = `${character.id}:${history.length}:${textIn}`;
  const tag = detectTag(textIn);
  let intent = detectIntent(textIn);
  if (intent === "ask" && tag) intent = "topic";
  if (!intent && tag) intent = "topic";
  if (!intent) intent = "chat";

  const ctx = {
    name: user.name || "あなた",
    topic: tag || "",
    echo: makeEcho(textIn),
    score,
    hobby: user.hobbies?.[0] || "休み",
  };

  const say = (value) => fill(pickDifferent(value, salt + intent, lastAi), ctx);
  const close = affection >= 75;

  let text = "";
  if (intent === "rude") text = say(character.boundary);
  else if (intent === "topic" && tag) {
    const hobby = HOBBIES.includes(tag);
    if (character.topics?.[tag]) text = say(character.topics[tag]);
    else if (hobby && character.hobbies.includes(tag)) text = say(character.hobbyHit);
    else if (hobby) text = say(character.curious);
    else text = say(close ? character.aboutTraitClose : character.aboutTrait);
  } else if (intent === "date") text = say(affection >= 55 ? character.dateLate : character.dateEarly);
  else if (intent === "greet" && close) text = say(character.greetClose || character.greet);
  else if (intent === "chemistry") text = say(character.chemistry);
  else text = say(character[intent] || character.chat);

  if (!text) text = say(character.chat);

  const shared = Boolean(tag && shares(user, character, tag));
  const delta = clamp(deltaFor(intent, textIn) + (shared ? 3 : 0), -8, 9);
  return { text, delta, tag, shared };
}

export function milestone(before, after) {
  const marks = [
    [40, "関係が動いた：話しやすい"],
    [75, "関係が動いた：気になる"],
    [90, "関係が動いた：特別"],
  ];
  return marks.find(([score]) => before < score && after >= score)?.[1] || null;
}
