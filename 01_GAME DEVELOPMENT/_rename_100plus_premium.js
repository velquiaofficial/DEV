"use strict";
/**
 * Elevate display + folder names for titles 101–315.
 * Relixia / Alexia never touched. No shared runtime introduced.
 */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

/** Curated premium names — atmospheric compounds, no DOCK/FORGE1 leftovers */
const MAP = {
  101: "LUMENMAW",
  102: "PULSARFORGE",
  103: "VERDANTFANG",
  104: "ASTRALVEIL",
  105: "LOTUSCROSS",
  106: "MIRRORLANCE",
  107: "OBSIDIANDRIFT",
  108: "ZEPHYRCREST",
  109: "PRISMCLEAVE",
  110: "MISTSWEEP",
  111: "AETHERSTACK",
  112: "MNEMOCARD",
  113: "STRIKERIFT",
  114: "GLACIERRINK",
  115: "VOIDTUNNEL",
  116: "ORIGAMIFOLD",
  117: "HEXALITH",
  118: "CRYSTALSPIRE",
  119: "RUNEWEAVE",
  120: "AUREPRESS",
  121: "MAGMAFUSE",
  122: "VERDANTLEAF",
  123: "INKETERNITY",
  124: "PAPERORBIT",
  125: "MEADOWCREASE",
  126: "OREIMPERIUM",
  127: "CAFECHRONOS",
  128: "ABYSSFARM",
  129: "STARFORGE",
  130: "OVENORBIT",
  131: "TIMBERREALM",
  132: "BYTEHARVEST",
  133: "INKIMPERIUM",
  134: "AMBERHIVE",
  135: "SALVAGECORE",
  136: "NOCTURNEHORDE",
  137: "FROSTLEGION",
  138: "EMBERTHRONG",
  139: "LEAFCRUSADE",
  140: "VOIDCREEPER",
  141: "CANDYSIEGE",
  142: "DUNELEGACY",
  143: "MEADOWSANCTUM",
  144: "PIXELRELIC",
  145: "PAPERTEMPEST",
  146: "PATHWARDEN",
  147: "ICEBASTION",
  148: "LAVARAMPART",
  149: "NEONCITADEL",
  150: "SANDPARAPET",
  151: "INKKEEP",
  152: "CANDYBASTION",
  153: "MEADOWPORTAL",
  154: "DUSKWATCH",
  155: "PAPERRAMPART",
  156: "WORDVEIL",
  157: "LEXILUMEN",
  158: "RUNEORACLE",
  159: "COLDGLYPH",
  160: "EMBERLEXICON",
  161: "LEAFARCANA",
  162: "SANDSCRIPTURE",
  163: "INKRIDDLE",
  164: "SWEETCIPHER",
  165: "FIELDLEXICON",
  166: "QUICKSILVER",
  167: "CEREBRALARC",
  168: "NOCTURNETRIVIA",
  169: "GLACIERIQ",
  170: "PYREFACT",
  171: "LEAFLORE",
  172: "NEONENIGMA",
  173: "SANDSCHOLAR",
  174: "INKTRIAL",
  175: "MEADOWMIND",
  176: "LANEVELOX",
  177: "FROSTRUSH",
  178: "EMBERSTRIDE",
  179: "NEONVELOCITY",
  180: "SANDSPRINT",
  181: "LEAFASCEND",
  182: "INKDASH",
  183: "CANDYVELOCITY",
  184: "MEADOWRUSH",
  185: "PAPERVELOX",
  186: "BLADECARD",
  187: "AETHERDUEL",
  188: "FROSTDECK",
  189: "LEAFCLASH",
  190: "INKWAR",
  191: "SWEETDUEL",
  192: "DUNEHAND",
  193: "MEADOWDECK",
  194: "DUSKHAND",
  195: "PAPERDUEL",
  196: "SUDOKUCORE",
  197: "NOCTURNESUDO",
  198: "GLACIERSUDO",
  199: "INKSUDO",
  200: "LEAFSUDO",
  201: "NEONSUDO",
  202: "SANDSUDO",
  203: "MAGMASUDO",
  204: "CANDYSUDO",
  205: "MEADOWSUDO",
  206: "PLOTSANCTUM",
  207: "BERRYGRID",
  208: "FROSTHARVEST",
  209: "DUNEFIELD",
  210: "NEONGROWTH",
  211: "INKTERRA",
  212: "EMBERPLOT",
  213: "DUSKCROP",
  214: "PAPERHARVEST",
  215: "MEADOWPLOT",
  216: "SUMERIANFORGE",
  217: "TAPSTRATUM",
  218: "HORDEFALL",
  219: "BASTIONEX",
  220: "GLYPHTRY",
  221: "FACTDART",
  222: "DASHCORE",
  223: "DECKSPIKE",
  224: "NINELOCK",
  225: "SOILLOOP",
  226: "BULLETRAIN",
  227: "CATCHBAY",
  228: "TWINCELL",
  229: "AUTOVINE",
  230: "BLADEORBIT",
  231: "ROUTEHOLD",
  232: "LETTERBAY",
  233: "QUIZBEAM",
  234: "LANEBEAT",
  235: "HANDSTORM",
  236: "DIGITKEEP",
  237: "HARVESTEX",
  238: "DODGECORE",
  239: "FALLGLOW",
  240: "GRIDGLOW",
  241: "COINMILL",
  242: "SWARMRUN",
  243: "SPIKEGRID",
  244: "TYPEVEIL",
  245: "BRAINLINE",
  246: "SPRINTORB",
  247: "CARDVAULT",
  248: "SUDOPULSE",
  249: "CROPORBIT",
  250: "VEILSTEP",
  251: "BASKETRX",
  252: "DOUBLERUNE",
  253: "DRILLBAY",
  254: "VITALRING",
  255: "KEEPFIRE",
  256: "CLUEGRID",
  257: "TRIVIABOX",
  258: "BOLTPATH",
  259: "MANABRIDGE",
  260: "BOXLOGIC",
  261: "PLOTWAVE",
  262: "SHIFTORBIT",
  263: "DROPPULSE",
  264: "FOLDCORE",
  265: "IDLEORBIT",
  266: "MOBWAVE",
  267: "WALLPULSE",
  268: "WORDORBIT",
  269: "MINDCHIP",
  270: "RUNPULSE",
  271: "SLASHDECK",
  272: "CELLCRAFT",
  273: "SEEDMILL",
  274: "DANCERING",
  275: "GRABORBIT",
  276: "PAIRPULSE",
  277: "PROFITPOD",
  278: "ASHCIRCLE",
  279: "TURRETLINE",
  280: "HINTLANE",
  281: "ANSWERPAD",
  282: "STRIDEREX",
  283: "ARCANEHAND",
  284: "ROWSEAL",
  285: "BARNPULSE",
  286: "MIRAGEPAD",
  287: "CATCHLINE",
  288: "MERGEBAY",
  289: "CLICKREEF",
  290: "SURGEARENA",
  291: "GATEWATCH",
  292: "ALPHALOCK",
  293: "KNOWWAVE",
  294: "VELOXARENA",
  295: "DUELPORT",
  296: "GRIDMIND",
  297: "FIELDCHIP",
  298: "SLIPWAVE",
  299: "FRUITRELIC",
  300: "SYNTHTILE",
  301: "YIELDHIVE",
  302: "PERIMETER",
  303: "PATHSEAL",
  304: "SPELLRELIC",
  305: "TESTSPARK",
  306: "RUSHRELIC",
  307: "TRICKLANE",
  308: "NUMBERRELIC",
  309: "GROWRELIC",
  310: "AVOIDRELIC",
  311: "TIMINGORB",
  312: "SUMSTRATUM",
  313: "TAPIMPERIUM",
  314: "HORDELEGACY",
  315: "BASTIONPRIME"
};

/** Second-pass polish for remaining mid-tier names still too plain */
const UPGRADE_PLAIN = {
  CANDYSIEGE: "CANDYSANCTUM",
  ICEBASTION: "GLACIERKEEP",
  INKKEEP: "INKSANCTUM",
  DUSKWATCH: "DUSKVIGIL",
  WORDVEIL: "WORDPHANTOM",
  INKRIDDLE: "INKSPHINX",
  LEAFLORE: "LEAFLIBRARY",
  MEADOWMIND: "MEADOWPSYCHE",
  SANDSPRINT: "SANDVELOX",
  MEADOWRUSH: "MEADOWVELOX",
  BLADECARD: "BLADEARCHIVE",
  AETHERDUEL: "AETHERCLASH",
  FROSTDECK: "FROSTARCHIVE",
  LEAFCLASH: "LEAFCONCLAVE",
  INKWAR: "INKCONQUEST",
  SWEETDUEL: "SWEETCONCLAVE",
  DUNEHAND: "DUNEARCANA",
  MEADOWDECK: "MEADOWARCHIVE",
  DUSKHAND: "DUSKARCANA",
  PAPERDUEL: "PAPERCONCLAVE",
  SUDOKUCORE: "SUDOKUSPINE",
  INKSUDO: "INKLATTICE",
  LEAFSUDO: "LEAFLATTICE",
  NEONSUDO: "NEONLATTICE",
  SANDSUDO: "SANDLATTICE",
  MAGMASUDO: "MAGMALATTICE",
  CANDYSUDO: "CANDYLATTICE",
  MEADOWSUDO: "MEADOWLATTICE",
  BERRYGRID: "BERRYORCHARD",
  DUNEFIELD: "DUNETERRACE",
  EMBERPLOT: "EMBERACRE",
  DUSKCROP: "DUSKHARVEST",
  MEADOWPLOT: "MEADOWACRE",
  HORDEFALL: "HORDEDESCENT",
  BASTIONEX: "BASTIONAXIOM",
  GLYPHTRY: "GLYPHTRIAL",
  FACTDART: "FACTLANCE",
  DASHCORE: "DASHNEXUS",
  DECKSPIKE: "DECKSPICULE",
  NINELOCK: "NINESEAL",
  SOILLOOP: "SOILORBIT",
  BULLETRAIN: "BULLETSQUALL",
  CATCHBAY: "CATCHHAVEN",
  TWINCELL: "TWINHELIX",
  AUTOVINE: "AUTOVINEA",
  BLADEORBIT: "BLADEHELIX",
  ROUTEHOLD: "ROUTECITADEL",
  LETTERBAY: "LETTERHAVEN",
  QUIZBEAM: "QUIZRADIANT",
  LANEBEAT: "LANEPULSE",
  HANDSTORM: "HANDTEMPEST",
  DIGITKEEP: "DIGITCITADEL",
  HARVESTEX: "HARVESTAXIOM",
  DODGECORE: "DODGENEXUS",
  FALLGLOW: "FALLLUMEN",
  GRIDGLOW: "GRIDLUMEN",
  COINMILL: "COINATELIER",
  SWARMRUN: "SWARMSTRIDE",
  SPIKEGRID: "SPIKELATTICE",
  TYPEVEIL: "TYPEPHANTOM",
  BRAINLINE: "BRAINMERIDIAN",
  SPRINTORB: "SPRINTSPHERE",
  CARDVAULT: "CARDRELIQUARY",
  SUDOPULSE: "SUDOMERIDIAN",
  CROPORBIT: "CROPHELIX",
  VEILSTEP: "VEILSTRIDE",
  BASKETRX: "BASKETRELIC",
  DOUBLERUNE: "TWINRUNE",
  DRILLBAY: "DRILLHAVEN",
  VITALRING: "VITALCIRCLET",
  KEEPFIRE: "KEEPFLAME",
  CLUEGRID: "CLUELATTICE",
  TRIVIABOX: "TRIVIARELIQUARY",
  BOLTPATH: "BOLTMERIDIAN",
  MANABRIDGE: "MANAARCH",
  BOXLOGIC: "BOXAXIOM",
  PLOTWAVE: "PLOTSURGE",
  SHIFTORBIT: "SHIFTHELIX",
  DROPPULSE: "DROPMERIDIAN",
  FOLDCORE: "FOLDNEXUS",
  IDLEORBIT: "IDLEHELIX",
  MOBWAVE: "MOBTEMPEST",
  WALLPULSE: "WALLMERIDIAN",
  WORDORBIT: "WORDHELIX",
  MINDCHIP: "MINDSHARD",
  RUNPULSE: "RUNMERIDIAN",
  SLASHDECK: "SLASHARCHIVE",
  CELLCRAFT: "CELLATELIER",
  SEEDMILL: "SEEDATELIER",
  DANCERING: "DANCECIRCLET",
  GRABORBIT: "GRABHELIX",
  PAIRPULSE: "PAIRMERIDIAN",
  PROFITPOD: "PROFITNEXUS",
  ASHCIRCLE: "ASHCIRCLET",
  TURRETLINE: "TURRETMERIDIAN",
  HINTLANE: "HINTMERIDIAN",
  ANSWERPAD: "ANSWERRELIC",
  STRIDEREX: "STRIDERAXIOM",
  ARCANEHAND: "ARCANEGRASP",
  ROWSEAL: "ROWGLYPH",
  BARNPULSE: "BARNMERIDIAN",
  MIRAGEPAD: "MIRAGERELIC",
  CATCHLINE: "CATCHMERIDIAN",
  MERGEBAY: "MERGEHAVEN",
  CLICKREEF: "CLICKCORAL",
  SURGEARENA: "SURGECOLISEUM",
  GATEWATCH: "GATEVIGIL",
  ALPHALOCK: "ALPHASEAL",
  KNOWWAVE: "KNOWSURGE",
  DUELPORT: "DUELHAVEN",
  GRIDMIND: "GRIDPSYCHE",
  FIELDCHIP: "FIELDSHARD",
  SLIPWAVE: "SLIPSURGE",
  SYNTHTILE: "SYNTHMOSAIC",
  YIELDHIVE: "YIELDIMPERIUM",
  PERIMETER: "PERIMETERAXIOM",
  PATHSEAL: "PATHGLYPH",
  TESTSPARK: "TESTFLARE",
  TRICKLANE: "TRICKMERIDIAN",
  TIMINGORB: "TIMINGSPHERE"
};

function walkFiles(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/node_modules|dist|\.git/.test(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out);
    else if (/\.(html|js|css|md|json|txt)$/i.test(ent.name)) out.push(full);
  }
}

function replaceAll(str, from, to) {
  if (!from || from === to) return str;
  return str.split(from).join(to);
}

const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{3}_/.test(d.name))
  .map((d) => d.name)
  .sort((a, b) => +a.split("_")[0] - +b.split("_")[0]);

const plan = [];
for (const name of dirs) {
  const num = +name.split("_")[0];
  if (num < 101 || num > 315) continue;
  const oldCode = name.slice(name.indexOf("_") + 1);
  let neu = MAP[num] || oldCode;
  if (UPGRADE_PLAIN[neu]) neu = UPGRADE_PLAIN[neu];
  // also upgrade if old plain name maps
  if (UPGRADE_PLAIN[oldCode] && !MAP[num]) neu = UPGRADE_PLAIN[oldCode];
  if (neu === oldCode && UPGRADE_PLAIN[oldCode]) neu = UPGRADE_PLAIN[oldCode];
  // final polish pass for anything still in UPGRADE looking at current neu
  if (UPGRADE_PLAIN[neu]) neu = UPGRADE_PLAIN[neu];
  if (neu === oldCode) {
    // force elevate unknowns: prefix AETHER-style
    neu = "AETHER" + oldCode.slice(0, Math.min(8, oldCode.length));
  }
  plan.push({ num, oldDir: name, oldCode, newCode: neu, newDir: `${num}_${neu}` });
}

// uniqueness check
const seen = new Set();
for (const p of plan) {
  let code = p.newCode;
  let n = 2;
  while (seen.has(code)) {
    code = p.newCode + n;
    n++;
  }
  p.newCode = code;
  p.newDir = `${p.num}_${code}`;
  seen.add(code);
}

console.log("Plan:", plan.length);
console.log(plan.slice(0, 15).map((p) => p.oldDir + " → " + p.newDir).join("\n"));
console.log("...");

let renamed = 0;
let updatedFiles = 0;
const errors = [];

for (const p of plan) {
  const from = path.join(ROOT, p.oldDir);
  const to = path.join(ROOT, p.newDir);
  if (!fs.existsSync(from)) {
    errors.push("missing " + p.oldDir);
    continue;
  }
  if (p.oldDir === p.newDir) {
    // still refresh display if needed
  } else if (fs.existsSync(to)) {
    errors.push("target exists " + p.newDir);
    continue;
  } else {
    fs.renameSync(from, to);
    renamed++;
  }

  const dir = fs.existsSync(to) ? to : from;
  const files = [];
  walkFiles(dir, files);

  for (const file of files) {
    let src = fs.readFileSync(file, "utf8");
    const before = src;
    // replace brand tokens (whole-word-ish via boundaries of non-alnum)
    const re = new RegExp("\\b" + p.oldCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
    src = src.replace(re, p.newCode);
    // common lower variants in keys
    src = replaceAll(src, p.oldCode.toLowerCase(), p.newCode.toLowerCase());
    // title patterns already covered by word replace
    if (src !== before) {
      fs.writeFileSync(file, src, "utf8");
      updatedFiles++;
    }
  }

  // ensure index.html h1/title if somehow missed
  const html = path.join(dir, "index.html");
  if (fs.existsSync(html)) {
    let h = fs.readFileSync(html, "utf8");
    const h2 = h
      .replace(/<title>[^<]*<\/title>/, `<title>${p.newCode} — VELQUIA</title>`)
      .replace(/<h1>[^<]*<\/h1>/, `<h1>${p.newCode}</h1>`)
      .replace(/aria-label="[^"]*"/g, `aria-label="${p.newCode}"`);
    if (h2 !== h) {
      fs.writeFileSync(html, h2, "utf8");
      updatedFiles++;
    }
  }
}

// write mapping log
const logPath = path.join(ROOT, "_rename_100plus_map.csv");
fs.writeFileSync(
  logPath,
  "num,old,new\n" + plan.map((p) => `${p.num},${p.oldCode},${p.newCode}`).join("\n") + "\n",
  "utf8"
);

console.log(JSON.stringify({ renamed, updatedFiles, errors: errors.slice(0, 20), total: plan.length, log: logPath }, null, 2));
console.log("Relixia never touched.");
