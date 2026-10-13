"use strict";
/**
 * Apps 50–99 — ~50 standalone studio tools from mixed angles.
 * No AI_ / GAME_ folder prefixes. Relixia files untouched.
 * _APP_SHARED is template-only; each app gets its own copies.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SHARED = path.join(ROOT, "_APP_SHARED");
const LIBS = ["shell.css", "ai.js", "i18n.js", "app-kit.js"];

/** @typedef {{dir:string,brand:string,sub:string,angle:string,title:{en:string,ja:string},lead:{en:string,ja:string},nav:string[][],key:string,kind:string,fields:{id:string,label:string,type:string,ph?:string,opts?:string[]}[],seeds:object[],ai:string[],tips:string[],metrics:string[]}} AppDef */

/** @type {AppDef[]} */
const APPS = [
  // —— Studio / narrative craft ——
  app("50_LORE_ATLAS", "LoreAtlas", "World lore desk", "studio", "Lore atlas", "世界観ロア図鑑",
    "Map factions, places, and myths without touching Relixia source files.", "勢力・地名・神話を整理（Relixia本体は変更しません）。",
    [["atlas", "Atlas", "図鑑"], ["links", "Links", "関係"], ["export", "Export", "出力"]],
    "vq_loreatlas_v1", "catalog",
    [f("name", "Entry", "text", "Amaterasu shrine"), f("faction", "Faction", "text", "JP myth"), f("note", "Note", "textarea", "Dawn motif…")],
    [{ name: "Frost court", faction: "North", note: "Ice etiquette", score: 80 }, { name: "Harbor guild", faction: "Trade", note: "Night markets", score: 65 }],
    ["Add a forbidden ruin", "Link two rival courts", "Write a founding myth beat"],
    ["Keep lore IDs stable", "Separate public vs secret lore"], ["Entries", "Factions", "Avg depth", "Ready"]),
  app("51_DIALOG_BENCH", "DialogBench", "Dialogue writer", "studio", "Dialogue bench", "セリフ作業台",
    "Draft NPC lines, branches, and tone tags for story scenes.", "NPCセリフ・分岐・トーンタグを下書き。",
    [["lines", "Lines", "セリフ"], ["branches", "Branches", "分岐"], ["tone", "Tone", "トーン"]],
    "vq_dialogbench_v1", "lines",
    [f("speaker", "Speaker", "text", "Guide"), f("line", "Line", "textarea", "The frost remembers…"), f("tone", "Tone", "select", "", ["soft", "sharp", "comic", "mythic"])],
    [{ speaker: "Guide", line: "Stay on the lit path.", tone: "soft", score: 70 }],
    ["Rewrite colder", "Add a choice fork", "Tag sarcasm beat"],
    ["One beat per line", "Mark spoilers"], ["Lines", "Speakers", "Branches", "Avg tone"]),
  app("52_LEVEL_CURVE", "LevelCurve", "Difficulty curves", "studio", "Level curve desk", "難易度カーブ台",
    "Shape XP, spawn pressure, and fail-safe difficulty bands.", "XP・湧き圧・救済帯のカーブを設計。",
    [["curve", "Curve", "カーブ"], ["bands", "Bands", "帯"], ["notes", "Notes", "メモ"]],
    "vq_levelcurve_v1", "curve",
    [f("level", "Level", "number", "1"), f("pressure", "Pressure 1-10", "number", "3"), f("note", "Note", "text", "Teach jump")],
    [{ level: 1, pressure: 2, note: "Tutorial", score: 40 }, { level: 5, pressure: 6, note: "First spike", score: 72 }],
    ["Smooth mid-game dip", "Add mercy band", "Spike boss chapter"],
    ["Never spike twice", "Log playtest deaths"], ["Points", "Max pressure", "Mercy", "Ready"]),
  app("53_LOCALE_PACK", "LocalePack", "Localization kit", "studio", "Locale string pack", "翻訳文字列パック",
    "Track EN/JA strings, length risks, and glossary terms.", "EN/JA文字列・文字数リスク・用語集。",
    [["strings", "Strings", "文字列"], ["glossary", "Glossary", "用語"], ["risks", "Risks", "リスク"]],
    "vq_localepack_v1", "locale",
    [f("key", "Key", "text", "ui.start"), f("en", "EN", "text", "Start"), f("ja", "JA", "text", "はじめる")],
    [{ key: "ui.start", en: "Start", ja: "はじめる", score: 90 }, { key: "ui.continue", en: "Continue", ja: "つづきから", score: 88 }],
    ["Flag long EN", "Suggest JA short form", "Add glossary term"],
    ["Lock UI keys", "Review honorifics"], ["Keys", "JA ready", "Risks", "Glossary"]),
  app("54_BUG_TRIAGE", "BugTriage", "QA triage", "studio", "Bug triage board", "バグトリアージ",
    "Prioritize repro steps, severity, and owner lanes.", "再現手順・深刻度・担当レーンを整理。",
    [["inbox", "Inbox", "受信"], ["lanes", "Lanes", "レーン"], ["sla", "SLA", "SLA"]],
    "vq_bugtriage_v1", "tickets",
    [f("title", "Title", "text", "Freeze on pause"), f("sev", "Severity", "select", "", ["S1", "S2", "S3", "S4"]), f("repro", "Repro", "textarea", "1. Open pause…")],
    [{ title: "UI clip on narrow", sev: "S3", repro: "Resize <360", score: 55 }],
    ["Promote to S2", "Ask for video", "Close as duplicate"],
    ["Repro or bounce", "One owner"], ["Open", "S1/S2", "Avg age", "Owners"]),
  app("55_PATCH_NOTES", "PatchNotes", "Patch writer", "studio", "Patch notes desk", "パッチノート台",
    "Group ship notes into player-facing and studio-facing lists.", "プレイヤー向け／社内向けに仕分け。",
    [["draft", "Draft", "下書き"], ["player", "Player", "公開"], ["internal", "Internal", "社内"]],
    "vq_patchnotes_v1", "notes",
    [f("title", "Change", "text", "Fixed freeze"), f("audience", "Audience", "select", "", ["player", "internal"]), f("body", "Body", "textarea", "Details…")],
    [{ title: "Balance: piece weights", audience: "player", body: "T5 less common", score: 75 }],
    ["Rewrite friendlier", "Split hotfix block", "Add thank-you line"],
    ["No jargon on player", "Link issue IDs"], ["Items", "Player", "Internal", "Version"]),
  app("56_ECONOMY_SIM", "EconomySim", "Economy desk", "studio", "Soft currency sim", "経済シミュ",
    "Model earn rates, sinks, and inflation pressure.", "入手量・消費口・インフレ圧を試算。",
    [["flows", "Flows", "フロー"], ["sinks", "Sinks", "消費"], ["forecast", "Forecast", "予測"]],
    "vq_economysim_v1", "economy",
    [f("name", "Source", "text", "Daily quest"), f("earn", "Earn/day", "number", "120"), f("sink", "Sink", "text", "Cosmetic")],
    [{ name: "Login", earn: 50, sink: "Energy", score: 60 }, { name: "Event", earn: 200, sink: "Gacha pity", score: 40 }],
    ["Cut earn 10%", "Add soft sink", "Inflation warning"],
    ["Track whale vs casual", "Cap stackable"], ["Sources", "Earn/day", "Sinks", "Pressure"]),
  app("57_NPC_SCHEDULE", "NpcSchedule", "NPC routines", "studio", "NPC day schedule", "NPC行動表",
    "Plan hourly NPC beats across districts.", "地区ごとの時刻別NPC行動。",
    [["day", "Day plan", "一日"], ["districts", "Districts", "地区"], ["events", "Events", "イベント"]],
    "vq_npcschedule_v1", "schedule",
    [f("npc", "NPC", "text", "Baker"), f("hour", "Hour", "number", "8"), f("place", "Place", "text", "Market"), f("act", "Action", "text", "Opens stall")],
    [{ npc: "Baker", hour: 7, place: "Oven", act: "Knead", score: 70 }],
    ["Fill lunch gap", "Festival override", "Rainy-day alt"],
    ["Avoid empty hours", "Sync with quests"], ["Slots", "NPCs", "Districts", "Conflicts"]),
  app("58_CUTSCENE_BOARD", "CutsceneBoard", "Cinematic board", "studio", "Cutscene storyboard", "カットシーン絵コンテ",
    "Shot list, duration, and camera intent for cinematics.", "ショット・尺・カメラ意図の絵コンテ。",
    [["shots", "Shots", "ショット"], ["timing", "Timing", "尺"], ["audio", "Audio", "音声"]],
    "vq_cutsceneboard_v1", "shots",
    [f("shot", "Shot", "text", "WS plaza"), f("sec", "Seconds", "number", "3"), f("intent", "Intent", "textarea", "Establish cold…")],
    [{ shot: "CU eyes", sec: 2, intent: "Fear beat", score: 82 }],
    ["Trim 20%", "Add silence beat", "Match BGM swell"],
    ["Readable silhouette", "VO under 12s"], ["Shots", "Total sec", "VO lines", "Ready"]),
  app("59_VOICE_CAST", "VoiceCast", "Voice casting", "studio", "Voice cast notes", "ボイスキャスティング",
    "Cast roles, tone refs, and take priorities.", "役・トーン参考・テイク優先度。",
    [["roles", "Roles", "役"], ["refs", "Refs", "参考"], ["takes", "Takes", "テイク"]],
    "vq_voicecast_v1", "cast",
    [f("role", "Role", "text", "Oracle"), f("tone", "Tone", "text", "Low warm"), f("priority", "Priority", "select", "", ["P0", "P1", "P2"])],
    [{ role: "Oracle", tone: "Low warm", priority: "P0", score: 90 }],
    ["Need younger alt", "Add laugh sample", "Mark ADR"],
    ["One P0 per scene", "Keep ref clips short"], ["Roles", "P0", "Refs", "Done"]),

  // —— Creator / media ——
  app("60_THUMB_LAB", "ThumbLab", "Thumbnail lab", "creator", "Thumbnail concepts", "サムネ概念ラボ",
    "Score hook, face, and text contrast ideas for thumbnails.", "フック・顔・文字コントラストを採点。",
    [["concepts", "Concepts", "案"], ["scores", "Scores", "採点"], ["export", "Export", "出力"]],
    "vq_thumblab_v1", "concepts",
    [f("hook", "Hook", "text", "Before/after freeze"), f("text", "On-image text", "text", "3秒で理解"), f("face", "Face?", "select", "", ["yes", "no"])],
    [{ hook: "Red vs blue", text: "どっち？", face: "yes", score: 78 }],
    ["Bigger number", "Cut words to 4", "Add curiosity gap"],
    ["Mobile crop first", "Avoid clutter"], ["Concepts", "Avg score", "Face use", "Ready"]),
  app("61_PODCAST_RUN", "PodcastRun", "Podcast run-of-show", "creator", "Podcast run sheet", "ポッドキャスト台本",
    "Segments, guest cues, and ad breaks for an episode.", "コーナー・ゲスト合図・提供入り。",
    [["segments", "Segments", "コーナー"], ["cues", "Cues", "合図"], ["ads", "Ads", "提供"]],
    "vq_podcastrun_v1", "segments",
    [f("name", "Segment", "text", "Cold open"), f("mins", "Minutes", "number", "3"), f("cue", "Cue", "text", "Theme sting")],
    [{ name: "Cold open", mins: 2, cue: "Sting", score: 70 }],
    ["Tighten mid", "Add listener question", "Move ad earlier"],
    ["Hard out times", "One CTA"], ["Segments", "Runtime", "Ads", "Guests"]),
  app("62_STREAM_HUD", "StreamHud", "Stream HUD planner", "creator", "Stream overlay plan", "配信HUD設計",
    "Layout alerts, goal bars, and safe zones for streams.", "アラート・目標バー・セーフゾーン。",
    [["layout", "Layout", "配置"], ["alerts", "Alerts", "通知"], ["goals", "Goals", "目標"]],
    "vq_streamhud_v1", "layout",
    [f("widget", "Widget", "text", "Sub goal"), f("corner", "Corner", "select", "", ["TL", "TR", "BL", "BR"]), f("note", "Note", "text", "Keep chat clear")],
    [{ widget: "Recent follow", corner: "BL", note: "2s fade", score: 65 }],
    ["Hide during boss", "Larger tip alert", "Safe zone phone"],
    ["Never cover face cam", "Test 720p"], ["Widgets", "Corners", "Alerts", "Goals"]),
  app("63_CLIP_MINE", "ClipMine", "Highlight miner", "creator", "Clip idea mine", "切り抜きアイデア",
    "Mine funny / hype / educational clip angles from sessions.", "面白・盛り・解説の切り抜き角度。",
    [["clips", "Clips", "候補"], ["tags", "Tags", "タグ"], ["queue", "Queue", "キュー"]],
    "vq_clipmine_v1", "clips",
    [f("title", "Title", "text", "Boss almost"), f("angle", "Angle", "select", "", ["funny", "hype", "edu"]), f("stamp", "Timestamp", "text", "12:04")],
    [{ title: "Misclick save", angle: "funny", stamp: "08:12", score: 84 }],
    ["Shorter hook", "Add caption beat", "Pair with CTA"],
    ["15–45s ideal", "Front-load punch"], ["Clips", "Funny", "Hype", "Queued"]),
  app("64_MERCH_SPEC", "MerchSpec", "Merch specs", "creator", "Merch drop specs", "グッズ仕様書",
    "SKU specs, print notes, and drop timing for merch.", "SKU・印刷メモ・ドロップ日程。",
    [["skus", "SKUs", "SKU"], ["print", "Print", "印刷"], ["drop", "Drop", "発売"]],
    "vq_merchspec_v1", "skus",
    [f("sku", "SKU", "text", "TEE-BLK-M"), f("item", "Item", "text", "Logo tee"), f("note", "Print note", "textarea", "Soft hand feel")],
    [{ sku: "MUG-ICE", item: "Frost mug", note: "Wrap art", score: 77 }],
    ["Add size run", "Check Pantone", "Bundle idea"],
    ["Mock before PO", "Margin check"], ["SKUs", "Ready art", "Drops", "Margin"]),

  // —— Business niches ——
  app("65_PRICE_MATRIX", "PriceMatrix", "Pricing matrix", "biz", "Pricing matrix", "価格マトリクス",
    "Compare tiers, limits, and willingness-to-pay notes.", "プラン・上限・支払意思の比較。",
    [["tiers", "Tiers", "プラン"], ["limits", "Limits", "上限"], ["notes", "Notes", "メモ"]],
    "vq_pricematrix_v1", "tiers",
    [f("tier", "Tier", "text", "Pro"), f("price", "Price/mo", "number", "4800"), f("limit", "Limit", "text", "10 seats")],
    [{ tier: "Free", price: 0, limit: "1 seat", score: 40 }, { tier: "Pro", price: 4800, limit: "10 seats", score: 75 }],
    ["Raise Pro 10%", "Add annual", "Cut Free limit"],
    ["Anchor with Pro", "Watch churn"], ["Tiers", "Max price", "Seats", "Notes"]),
  app("66_CHURN_WATCH", "ChurnWatch", "Churn signals", "biz", "Churn watchlist", "解約シグナル監視",
    "Track risk accounts, last touch, and save offers.", "危険口座・最終接点・挽回オファー。",
    [["risks", "Risks", "危険"], ["touches", "Touches", "接点"], ["offers", "Offers", "提案"]],
    "vq_churnwatch_v1", "risks",
    [f("account", "Account", "text", "Studio K"), f("risk", "Risk 1-100", "number", "72"), f("reason", "Reason", "text", "Low login")],
    [{ account: "Nova Co", risk: 81, reason: "Support ticket open", score: 20 }],
    ["Propose pause plan", "Book success call", "Send winback"],
    ["Touch in 48h", "One offer"], ["At risk", "Avg risk", "Touches", "Saves"]),
  app("67_SLA_DESK", "SlaDesk", "SLA desk", "biz", "Support SLA desk", "サポートSLA台",
    "Ticket ages, priorities, and breach warnings.", "チケット経過・優先度・違反警告。",
    [["queue", "Queue", "待ち"], ["breaches", "Breaches", "違反"], ["owners", "Owners", "担当"]],
    "vq_sladesk_v1", "queue",
    [f("ticket", "Ticket", "text", "#1042 login"), f("prio", "Priority", "select", "", ["P1", "P2", "P3"]), f("ageh", "Age hours", "number", "5")],
    [{ ticket: "#991 billing", prio: "P1", ageh: 3, score: 30 }],
    ["Escalate P1", "Reassign owner", "Extend courtesy"],
    ["P1 < 4h", "Update status"], ["Open", "P1", "Breaches", "Owners"]),
  app("68_RFP_ROOM", "RfpRoom", "RFP room", "biz", "RFP answer room", "RFP回答ルーム",
    "Break RFPs into requirements, owners, and draft answers.", "要件分解・担当・下書き回答。",
    [["reqs", "Reqs", "要件"], ["answers", "Answers", "回答"], ["gaps", "Gaps", "不足"]],
    "vq_rfproom_v1", "reqs",
    [f("req", "Requirement", "text", "SSO support"), f("owner", "Owner", "text", "Eng"), f("status", "Status", "select", "", ["todo", "draft", "done"])],
    [{ req: "ISO evidence", owner: "Ops", status: "todo", score: 50 }],
    ["Draft SSO answer", "Flag gap", "Reuse prior RFP"],
    ["Cite proof", "No overclaim"], ["Reqs", "Done", "Gaps", "Owners"]),
  app("69_VENDOR_SCORE", "VendorScore", "Vendor scoring", "biz", "Vendor scorecards", "ベンダー採点",
    "Score vendors on cost, risk, and delivery.", "コスト・リスク・納期で採点。",
    [["vendors", "Vendors", "業者"], ["scores", "Scores", "採点"], ["decide", "Decide", "決定"]],
    "vq_vendorscore_v1", "vendors",
    [f("name", "Vendor", "text", "PrintCo"), f("cost", "Cost 1-10", "number", "6"), f("risk", "Risk 1-10", "number", "3"), f("speed", "Speed 1-10", "number", "8")],
    [{ name: "PrintCo", cost: 6, risk: 3, speed: 8, score: 74 }],
    ["Negotiate MOQ", "Ask backup plant", "Shortlist 2"],
    ["Weight risk higher", "Keep backups"], ["Vendors", "Top score", "High risk", "Shortlist"]),
  app("70_POLICY_DRAFT", "PolicyDraft", "Policy drafts", "biz", "Policy draft desk", "ポリシー下書き",
    "Draft internal policies with owners and review dates.", "社内ポリシー下書き・担当・見直し日。",
    [["drafts", "Drafts", "下書き"], ["owners", "Owners", "担当"], ["reviews", "Reviews", "見直し"]],
    "vq_policydraft_v1", "drafts",
    [f("title", "Policy", "text", "Remote work"), f("owner", "Owner", "text", "HR"), f("body", "Body", "textarea", "Core hours…")],
    [{ title: "Data retention", owner: "Legal", body: "90-day logs", score: 68 }],
    ["Simplify language", "Add exception", "Set review +6m"],
    ["Plain Japanese first", "Version stamp"], ["Policies", "Owners", "Due reviews", "Ready"]),
  app("71_AUDIT_TRAIL", "AuditTrail", "Audit checklist", "biz", "Audit trail checklist", "監査チェックリスト",
    "Evidence items, owners, and pass/fail for audits.", "証跡・担当・合否の監査台帳。",
    [["checks", "Checks", "項目"], ["evidence", "Evidence", "証跡"], ["status", "Status", "状態"]],
    "vq_audittrail_v1", "checks",
    [f("item", "Check", "text", "Access review"), f("owner", "Owner", "text", "IT"), f("result", "Result", "select", "", ["pass", "fail", "na"])],
    [{ item: "MFA enforced", owner: "IT", result: "pass", score: 90 }],
    ["Request screenshot", "Mark fail", "Schedule retest"],
    ["Evidence links", "No empty pass"], ["Checks", "Pass", "Fail", "Owners"]),
  app("72_CAP_TABLE", "CapTable", "Cap table notes", "biz", "Simple cap notes", "キャップテーブルメモ",
    "Lightweight ownership notes (demo only, not legal advice).", "持分メモ（デモ。法的助言ではありません）。",
    [["holders", "Holders", "保有者"], ["rounds", "Rounds", "ラウンド"], ["notes", "Notes", "メモ"]],
    "vq_captable_v1", "holders",
    [f("name", "Holder", "text", "Founder A"), f("pct", "%", "number", "40"), f("class", "Class", "select", "", ["common", "preferred", "option"])],
    [{ name: "Founder A", pct: 45, class: "common", score: 100 }],
    ["Model option pool", "Note SAFE", "Summarize round"],
    ["Demo only", "Confirm with counsel"], ["Holders", "Sum %", "Rounds", "Options"]),
  app("73_OKR_BOARD", "OkrBoard", "OKR board", "biz", "OKR board", "OKRボード",
    "Objectives, key results, and weekly confidence.", "目標・KR・週次確信度。",
    [["okrs", "OKRs", "OKR"], ["week", "Week", "週次"], ["risks", "Risks", "リスク"]],
    "vq_okrboard_v1", "okrs",
    [f("obj", "Objective", "text", "Ship polish"), f("kr", "Key result", "text", "NPS +8"), f("conf", "Confidence %", "number", "60")],
    [{ obj: "Grow MAU", kr: "+15% WAUs", conf: 55, score: 55 }],
    ["Lower KR scope", "Raise confidence", "Add risk"],
    ["3 OKRs max", "Measurable KRs"], ["OKRs", "Avg conf", "At risk", "Wins"]),
  app("74_HIRING_SCORE", "HiringScore", "Hiring scorecards", "biz", "Hiring scorecards", "採用スコアカード",
    "Score candidates on craft, communication, and values.", "技術・コミュ・価値観で採点。",
    [["candidates", "Candidates", "候補"], ["rubric", "Rubric", "観点"], ["decide", "Decide", "判定"]],
    "vq_hiringscore_v1", "candidates",
    [f("name", "Name", "text", "Yuki"), f("craft", "Craft 1-5", "number", "4"), f("comms", "Comms 1-5", "number", "4"), f("values", "Values 1-5", "number", "5")],
    [{ name: "Yuki", craft: 4, comms: 5, values: 4, score: 86 }],
    ["Need system design", "Strong culture add", "Hold for next role"],
    ["Same rubric always", "Write examples"], ["Candidates", "Top", "Avg", "Hires"]),

  // —— Local / lifestyle ——
  app("75_EVENT_FLOOR", "EventFloor", "Event floor plan", "life", "Event floor planner", "イベント会場プラン",
    "Booths, flows, and staff posts for events.", "ブース・動線・スタッフ配置。",
    [["floor", "Floor", "配置"], ["flow", "Flow", "動線"], ["staff", "Staff", "人員"]],
    "vq_eventfloor_v1", "floor",
    [f("zone", "Zone", "text", "Entrance"), f("use", "Use", "text", "Badge pickup"), f("staffn", "Staff", "number", "2")],
    [{ zone: "Stage L", use: "Talks", staffn: 3, score: 70 }],
    ["Widen aisle", "Add quiet room", "Move photo wall"],
    ["Fire exits clear", "Queue capacity"], ["Zones", "Staff", "Flows", "Risks"]),
  app("76_MENU_COST", "MenuCost", "Menu costing", "life", "Menu cost desk", "メニュー原価台",
    "Ingredient costs, plate margins, and seasonal swaps.", "原価・粗利・季節入替。",
    [["plates", "Plates", "料理"], ["costs", "Costs", "原価"], ["season", "Season", "季節"]],
    "vq_menucost_v1", "plates",
    [f("name", "Dish", "text", "Ramen"), f("cost", "Cost", "number", "280"), f("price", "Price", "number", "980")],
    [{ name: "Ramen", cost: 280, price: 980, score: 71 }],
    ["Swap broth", "Raise price 50", "Lunch set"],
    ["Target 30%+ margin", "Waste log"], ["Dishes", "Avg margin", "Low margin", "Seasonal"]),
  app("77_RENTAL_LEDGER", "RentalLedger", "Rental ledger", "life", "Rental property ledger", "賃貸台帳",
    "Units, tenants, and maintenance tickets (demo).", "部屋・入居・修繕（デモ）。",
    [["units", "Units", "部屋"], ["tenants", "Tenants", "入居"], ["maint", "Maint", "修繕"]],
    "vq_rentalledger_v1", "units",
    [f("unit", "Unit", "text", "203"), f("rent", "Rent", "number", "78000"), f("status", "Status", "select", "", ["occupied", "vacant", "notice"])],
    [{ unit: "101", rent: 72000, status: "occupied", score: 80 }],
    ["Schedule inspection", "List vacant", "Raise renew"],
    ["Track deposits", "Photo on exit"], ["Units", "Occupied", "Vacant", "Tickets"]),
  app("78_CLINIC_FLOW", "ClinicFlow", "Clinic flow", "life", "Clinic visit flow", "クリニック動線",
    "Reception → exam → checkout timing notes.", "受付→診察→会計の時間設計。",
    [["steps", "Steps", "工程"], ["waits", "Waits", "待ち"], ["staff", "Staff", "人員"]],
    "vq_clinicflow_v1", "steps",
    [f("step", "Step", "text", "Reception"), f("mins", "Minutes", "number", "4"), f("owner", "Owner", "text", "Front")],
    [{ step: "Exam", mins: 12, owner: "Dr", score: 65 }],
    ["Cut form time", "Add triage nurse", "SMS ready"],
    ["Peak hour plan", "Privacy"], ["Steps", "Total mins", "Bottleneck", "Staff"]),
  app("79_SCHOOL_UNIT", "SchoolUnit", "Lesson units", "life", "Lesson unit planner", "授業ユニット設計",
    "Objectives, activities, and homework for a unit.", "目標・活動・宿題の単元設計。",
    [["unit", "Unit", "単元"], ["acts", "Activities", "活動"], ["hw", "Homework", "宿題"]],
    "vq_schoolunit_v1", "unit",
    [f("title", "Lesson", "text", "Fractions day 1"), f("mins", "Minutes", "number", "45"), f("goal", "Goal", "text", "Compare 1/2 vs 1/3")],
    [{ title: "Warm-up", mins: 8, goal: "Prior knowledge", score: 70 }],
    ["Add pair work", "Shorter lecture", "Exit ticket"],
    ["One clear goal", "Differentiate"], ["Lessons", "Minutes", "HW", "Checks"]),
  app("80_FARM_LOG", "FarmLog", "Farm / crop log", "life", "Crop log", "栽培ログ",
    "Plantings, weather notes, and harvest yields.", "定植・天候・収穫量。",
    [["plots", "Plots", "区画"], ["tasks", "Tasks", "作業"], ["yield", "Yield", "収穫"]],
    "vq_farmlog_v1", "plots",
    [f("plot", "Plot", "text", "A1"), f("crop", "Crop", "text", "Tomato"), f("note", "Note", "text", "Mulched")],
    [{ plot: "B2", crop: "Basil", note: "Pinched", score: 75 }],
    ["Water schedule", "Pest watch", "Harvest window"],
    ["Photo weekly", "Soil pH"], ["Plots", "Crops", "Tasks", "Yield"]),
  app("81_PET_CARE", "PetCare", "Pet care", "life", "Pet care schedule", "ペットケア予定",
    "Feeding, walks, vet, and meds reminders.", "食事・散歩・病院・投薬。",
    [["pets", "Pets", "ペット"], ["routine", "Routine", "日課"], ["vet", "Vet", "病院"]],
    "vq_petcare_v1", "pets",
    [f("name", "Name", "text", "Mochi"), f("task", "Task", "text", "Evening walk"), f("when", "When", "text", "19:00")],
    [{ name: "Mochi", task: "Breakfast", when: "07:30", score: 90 }],
    ["Add med reminder", "Grooming slot", "Vet annual"],
    ["Dose exact", "Weight log"], ["Pets", "Tasks", "Vet due", "Meds"]),
  app("82_MOVE_CHECK", "MoveCheck", "Moving checklist", "life", "Move checklist", "引越しチェック",
    "Rooms, utilities, and address-change tasks.", "部屋・ライフライン・住所変更。",
    [["rooms", "Rooms", "部屋"], ["utils", "Utilities", "ライフライン"], ["paper", "Paperwork", "届出"]],
    "vq_movecheck_v1", "rooms",
    [f("item", "Task", "text", "Pack kitchen"), f("area", "Area", "select", "", ["room", "util", "paper"]), f("done", "Done?", "select", "", ["no", "yes"])],
    [{ item: "Internet transfer", area: "util", done: "no", score: 40 }],
    ["Book movers", "Cleansing day", "School transfer"],
    ["2-week utility", "Photo meters"], ["Tasks", "Done", "Utils", "Paper"]),
  app("83_WEDDING_RUN", "WeddingRun", "Wedding run sheet", "life", "Wedding run-of-show", "結婚式進行表",
    "Ceremony cues, vendors, and day-of timing.", "式次第・業者・当日タイム。",
    [["cues", "Cues", "合図"], ["vendors", "Vendors", "業者"], ["day", "Day-of", "当日"]],
    "vq_weddingrun_v1", "cues",
    [f("cue", "Cue", "text", "Processional"), f("time", "Time", "text", "13:00"), f("owner", "Owner", "text", "Planner")],
    [{ cue: "First look", time: "11:30", owner: "Photo", score: 85 }],
    ["Buffer rain", "Mic check", "Guest flow"],
    ["Hard start times", "Vendor meals"], ["Cues", "Vendors", "Buffers", "Ready"]),
  app("84_SPORT_DRILL", "SportDrill", "Sports drills", "life", "Drill book", "練習ドリル帳",
    "Drills, duration, and intensity for practice.", "ドリル・時間・強度の練習帳。",
    [["drills", "Drills", "ドリル"], ["session", "Session", "セッション"], ["load", "Load", "負荷"]],
    "vq_sportdrill_v1", "drills",
    [f("name", "Drill", "text", "Passing square"), f("mins", "Minutes", "number", "12"), f("intensity", "Intensity 1-5", "number", "3")],
    [{ name: "Warm-up jog", mins: 8, intensity: 2, score: 60 }],
    ["Add cooldown", "Compete round", "Skill focus"],
    ["Age-appropriate", "Hydration"], ["Drills", "Minutes", "Avg load", "Sessions"]),

  // —— Product / engineering ——
  app("85_API_CATALOG", "ApiCatalog", "API catalog", "eng", "API endpoint catalog", "APIカタログ",
    "Document endpoints, auth, and sample payloads.", "エンドポイント・認証・サンプル。",
    [["apis", "APIs", "API"], ["auth", "Auth", "認証"], ["samples", "Samples", "サンプル"]],
    "vq_apicatalog_v1", "apis",
    [f("method", "Method", "select", "", ["GET", "POST", "PUT", "DELETE"]), f("path", "Path", "text", "/v1/items"), f("auth", "Auth", "select", "", ["none", "key", "oauth"])],
    [{ method: "GET", path: "/v1/health", auth: "none", score: 95 }],
    ["Add error codes", "Sample 401", "Deprecate note"],
    ["Version paths", "Idempotency"], ["Endpoints", "Authed", "Samples", "Deprecated"]),
  app("86_ERROR_TAXONOMY", "ErrorTaxonomy", "Error taxonomy", "eng", "Error code taxonomy", "エラー体系",
    "Stable codes, user copy, and owner teams.", "安定コード・ユーザー文・担当。",
    [["codes", "Codes", "コード"], ["copy", "Copy", "文言"], ["owners", "Owners", "担当"]],
    "vq_errortax_v1", "codes",
    [f("code", "Code", "text", "AUTH_401"), f("user", "User copy", "text", "Please sign in again"), f("owner", "Owner", "text", "Identity")],
    [{ code: "PAY_402", user: "Payment required", owner: "Billing", score: 80 }],
    ["Softer copy", "Add retry hint", "Map HTTP"],
    ["Never reuse codes", "Localize later"], ["Codes", "Teams", "HTTP map", "Ready"]),
  app("87_FEATURE_FLAG", "FeatureFlag", "Feature flags", "eng", "Feature flag board", "フィーチャーフラグ",
    "Flags, cohorts, and rollout percentages.", "フラグ・対象・ロールアウト%。",
    [["flags", "Flags", "フラグ"], ["cohorts", "Cohorts", "対象"], ["rollout", "Rollout", "%"]],
    "vq_featureflag_v1", "flags",
    [f("flag", "Flag", "text", "new_checkout"), f("pct", "Rollout %", "number", "10"), f("cohort", "Cohort", "text", "beta")],
    [{ flag: "dark_nav", pct: 100, cohort: "all", score: 90 }],
    ["Bump to 25%", "Kill switch", "Add sticky"],
    ["Owner required", "Expiry date"], ["Flags", "Partial", "Full", "Owners"]),
  app("88_RELEASE_TRAIN", "ReleaseTrain", "Release train", "eng", "Release train board", "リリーストレイン",
    "Train slots, commits, and freeze windows.", "枠・コミット・フリーズ期間。",
    [["trains", "Trains", "列車"], ["items", "Items", "項目"], ["freeze", "Freeze", "凍結"]],
    "vq_releasetrain_v1", "trains",
    [f("train", "Train", "text", "2026-W42"), f("item", "Change", "text", "Checkout fix"), f("risk", "Risk", "select", "", ["low", "mid", "high"])],
    [{ train: "2026-W41", item: "i18n pack", risk: "low", score: 70 }],
    ["Slip mid item", "Start freeze", "Hotfix lane"],
    ["No high after freeze", "Changelog"], ["Trains", "Items", "High risk", "Frozen"]),
  app("89_DESIGN_TOKEN", "DesignToken", "Design tokens", "eng", "Design token desk", "デザイントークン",
    "Color, space, and type tokens for product UI.", "色・余白・文字のトークン。",
    [["tokens", "Tokens", "トークン"], ["themes", "Themes", "テーマ"], ["export", "Export", "出力"]],
    "vq_designtoken_v1", "tokens",
    [f("name", "Token", "text", "color.brand"), f("value", "Value", "text", "#5fd4b3"), f("group", "Group", "select", "", ["color", "space", "type"])],
    [{ name: "space.md", value: "12px", group: "space", score: 85 }],
    ["Dark alias", "Radius scale", "Export CSS"],
    ["No raw hex in app", "Document usage"], ["Tokens", "Colors", "Themes", "Ready"]),
  app("90_A11Y_AUDIT", "A11yAudit", "A11y audit", "eng", "Accessibility audit", "アクセシビリティ監査",
    "WCAG-ish checks, owners, and severity.", "チェック・担当・深刻度。",
    [["checks", "Checks", "項目"], ["issues", "Issues", "指摘"], ["fix", "Fixes", "修正"]],
    "vq_a11yaudit_v1", "checks",
    [f("check", "Check", "text", "Focus order"), f("sev", "Severity", "select", "", ["crit", "ser", "mod"]), f("page", "Page", "text", "/checkout")],
    [{ check: "Alt text hero", sev: "ser", page: "/", score: 40 }],
    ["Keyboard path", "Contrast fail", "Announce live"],
    ["Test with SR", "Don't ship crit"], ["Checks", "Crit", "Open", "Fixed"]),
  app("91_PERF_BUDGET", "PerfBudget", "Perf budgets", "eng", "Performance budget", "パフォーマンス予算",
    "Budgets for JS, images, and LCP targets.", "JS・画像・LCPの予算。",
    [["budgets", "Budgets", "予算"], ["actuals", "Actuals", "実測"], ["actions", "Actions", "対策"]],
    "vq_perfbudget_v1", "budgets",
    [f("metric", "Metric", "text", "JS KB"), f("budget", "Budget", "number", "180"), f("actual", "Actual", "number", "210")],
    [{ metric: "LCP ms", budget: 2500, actual: 3100, score: 35 }],
    ["Defer analytics", "Compress hero", "Split route"],
    ["CI fail over budget", "Mobile first"], ["Metrics", "Over", "Under", "Actions"]),
  app("92_DATA_DICT", "DataDict", "Data dictionary", "eng", "Data dictionary", "データ辞書",
    "Tables, fields, PII flags, and owners.", "テーブル・項目・PII・担当。",
    [["tables", "Tables", "表"], ["fields", "Fields", "項目"], ["pii", "PII", "PII"]],
    "vq_datadict_v1", "tables",
    [f("table", "Table", "text", "users"), f("field", "Field", "text", "email"), f("pii", "PII?", "select", "", ["yes", "no"])],
    [{ table: "users", field: "email", pii: "yes", score: 100 }],
    ["Add retention", "Mask in logs", "Owner team"],
    ["PII needs DPA", "Stable names"], ["Tables", "Fields", "PII", "Owners"]),
  app("93_PROMPT_LAB", "PromptLab", "Prompt library", "eng", "Prompt library", "プロンプト庫",
    "Version prompts, inputs, and eval notes (local demo).", "プロンプト版・入力・評価メモ（ローカル）。",
    [["prompts", "Prompts", "プロンプト"], ["vars", "Vars", "変数"], ["evals", "Evals", "評価"]],
    "vq_promptlab_v1", "prompts",
    [f("name", "Name", "text", "tone_rewrite"), f("body", "Body", "textarea", "Rewrite softer: {{text}}"), f("ver", "Version", "text", "v3")],
    [{ name: "summarize_ja", body: "Summarize in JA: {{text}}", ver: "v2", score: 78 }],
    ["Tighten system", "Add refusal", "Few-shot pair"],
    ["Log failures", "Pin prod ver"], ["Prompts", "Versions", "Evals", "Pinned"]),
  app("94_EVAL_SET", "EvalSet", "Eval datasets", "eng", "Eval set builder", "評価セット作成",
    "Cases, expected outputs, and pass rates.", "ケース・期待出力・合格率。",
    [["cases", "Cases", "ケース"], ["expect", "Expect", "期待"], ["scores", "Scores", "得点"]],
    "vq_evalset_v1", "cases",
    [f("caseid", "Case ID", "text", "c01"), f("input", "Input", "textarea", "User asks refund"), f("expect", "Expect", "textarea", "Ask order id")],
    [{ caseid: "c01", input: "Hello", expect: "Greet + offer help", score: 70 }],
    ["Add edge case", "Mark flake", "Raise bar"],
    ["Golden set small", "Version set"], ["Cases", "Pass%", "Flakes", "Ready"]),

  // —— Community ——
  app("95_MOD_QUEUE", "ModQueue", "Moderation queue", "community", "Moderation queue", "モデレーション待ち",
    "Reports, actions, and appeal notes.", "通報・対応・異議メモ。",
    [["queue", "Queue", "待ち"], ["actions", "Actions", "対応"], ["appeals", "Appeals", "異議"]],
    "vq_modqueue_v1", "queue",
    [f("report", "Report", "text", "Spam link"), f("action", "Action", "select", "", ["warn", "mute", "ban", "dismiss"]), f("note", "Note", "text", "Repeat")],
    [{ report: "Hate slur", action: "ban", note: "Policy 4.2", score: 20 }],
    ["Need second mod", "Escalate legal", "Restore with warning"],
    ["Two-eyes for ban", "Log reason"], ["Open", "Bans", "Appeals", "SLA"]),
  app("96_AMBASSADOR", "Ambassador", "Ambassador program", "community", "Ambassador desk", "アンバサダー台帳",
    "Members, perks, and monthly missions.", "メンバー・特典・月次ミッション。",
    [["members", "Members", "会員"], ["perks", "Perks", "特典"], ["missions", "Missions", "任務"]],
    "vq_ambassador_v1", "members",
    [f("name", "Name", "text", "Rina"), f("tier", "Tier", "select", "", ["bronze", "silver", "gold"]), f("city", "City", "text", "Osaka")],
    [{ name: "Rina", tier: "gold", city: "Osaka", score: 88 }],
    ["Ship swag", "New mission", "Spotlight post"],
    ["Clear perks", "Monthly sync"], ["Members", "Gold", "Missions", "Shipped"]),
  app("97_SURVEY_PULSE", "SurveyPulse", "Pulse survey", "community", "Pulse survey desk", "パルス調査台",
    "Short surveys, scores, and themes.", "短アンケート・得点・テーマ。",
    [["surveys", "Surveys", "調査"], ["themes", "Themes", "テーマ"], ["actions", "Actions", "施策"]],
    "vq_surveypulse_v1", "surveys",
    [f("q", "Question", "text", "How easy was setup?"), f("nps", "Score 0-10", "number", "8"), f("theme", "Theme", "text", "onboarding")],
    [{ q: "Recommend us?", nps: 9, theme: "loyalty", score: 90 }],
    ["Follow-up interview", "Fix top friction", "Share win"],
    ["Weekly pulse", "Close loop"], ["Responses", "Avg", "Detractors", "Themes"]),
  app("98_ROADMAP_VOTE", "RoadmapVote", "Roadmap voting", "community", "Roadmap vote board", "ロードマップ投票",
    "Ideas, votes, and status for the public roadmap.", "アイデア・票・公開ロードマップ状態。",
    [["ideas", "Ideas", "案"], ["votes", "Votes", "票"], ["status", "Status", "状態"]],
    "vq_roadmapvote_v1", "ideas",
    [f("idea", "Idea", "text", "Offline mode"), f("votes", "Votes", "number", "42"), f("status", "Status", "select", "", ["new", "planned", "shipped"])],
    [{ idea: "CSV export", votes: 58, status: "planned", score: 80 }],
    ["Merge duplicates", "Mark shipped", "Ask for use-case"],
    ["Transparent status", "No silent drops"], ["Ideas", "Votes", "Planned", "Shipped"]),
  app("99_CHANGELOG", "ChangeLog", "Public changelog", "community", "Public changelog", "公開チェンジログ",
    "Ship notes by date with tags for users.", "日付別の公開アップデート記録。",
    [["entries", "Entries", "記事"], ["tags", "Tags", "タグ"], ["publish", "Publish", "公開"]],
    "vq_changelog_v1", "entries",
    [f("title", "Title", "text", "Faster export"), f("tag", "Tag", "select", "", ["new", "fix", "improve"]), f("body", "Body", "textarea", "Exports finish ~2x faster.")],
    [{ title: "Mobile polish", tag: "improve", body: "Nav spacing", score: 75 }],
    ["User-facing rewrite", "Add GIF note", "Pin highlight"],
    ["Ship weekly", "Link docs"], ["Entries", "New", "Fixes", "Drafts"])
];

function f(id, label, type, ph, opts) {
  const o = { id, label, type, ph: ph || "" };
  if (opts) o.opts = opts;
  return o;
}

function app(dir, brand, sub, angle, titleEn, titleJa, leadEn, leadJa, nav, key, kind, fields, seeds, ai, tips, metrics) {
  return {
    dir, brand, sub, angle,
    title: { en: titleEn, ja: titleJa },
    lead: { en: leadEn, ja: leadJa },
    nav, key, kind, fields, seeds, ai, tips, metrics
  };
}

function copyLibs(dest) {
  LIBS.forEach((name) => {
    const src = path.join(SHARED, name);
    if (!fs.existsSync(src)) throw new Error("Missing shared lib: " + name);
    fs.copyFileSync(src, path.join(dest, name));
  });
}

function indexHtml(a) {
  const nav = a.nav
    .map((n, i) => `      <button class="nav-btn${i ? "" : " active"}" data-view="${n[0]}" data-i18n="nav_${n[0]}">${n[1]}</button>`)
    .join("\n");
  const views = a.nav
    .map((n, i) => `      <section id="view-${n[0]}" class="section-enter${i ? " hidden" : ""}"></section>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#06060a">
  <title>${a.brand} — VELQUIA</title>
  <link rel="stylesheet" href="shell.css">
</head>
<body>
  <div class="app">
    <aside class="side">
      <div class="brand">${a.brand}<small data-i18n="sub">${a.sub}</small></div>
      <p class="nav-label" data-i18n="angle_label">Angle</p>
      <p class="mini" style="padding:0 10px 10px;margin:0" data-i18n="angle">${a.angle}</p>
${nav}
      <div class="side-foot">
        <span data-i18n="foot2">Standalone · local demo</span>
      </div>
    </aside>
    <main class="main">
      <div class="workspace-banner">
        <div><span class="status-dot"></span><strong>${a.brand}</strong> · <span data-i18n="banner">VELQUIA workspace</span></div>
        <span class="badge ok" data-i18n="live">Local live</span>
      </div>
      <div class="top">
        <div>
          <h1 data-i18n="title">${a.title.en}</h1>
          <p data-i18n="lead">${a.lead.en}</p>
        </div>
        <div class="top-actions">
          <button type="button" class="primary" id="btn-primary" data-i18n="btn_primary">Run AI</button>
          <button type="button" id="btn-seed" data-i18n="btn_seed">Seed demo</button>
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

function stringsJs(a) {
  const en = {
    sub: a.sub,
    title: a.title.en,
    lead: a.lead.en,
    angle: a.angle,
    angle_label: "Angle",
    foot: "App lineup",
    foot2: "Standalone · local demo",
    banner: "VELQUIA workspace",
    live: "Local live",
    btn_primary: "Run AI",
    btn_seed: "Seed demo"
  };
  const ja = {
    sub: a.sub,
    title: a.title.ja,
    lead: a.lead.ja,
    angle: a.angle,
    angle_label: "切り口",
    foot: "アプリ一覧",
    foot2: "独立デモ · ローカル保存",
    banner: "VELQUIA ワークスペース",
    live: "ローカル稼働",
    btn_primary: "AI実行",
    btn_seed: "デモ投入"
  };
  a.nav.forEach((n) => {
    en["nav_" + n[0]] = n[1];
    ja["nav_" + n[0]] = n[2];
  });
  return `"use strict";\nwindow.VQ_STRINGS=${JSON.stringify({ en, ja }, null, 2)};\n`;
}

function fieldInputs(fields) {
  return fields
    .map((fld) => {
      if (fld.type === "textarea") {
        return `          <label>${fld.label}</label><textarea id="f-${fld.id}" placeholder="${fld.ph || ""}"></textarea>`;
      }
      if (fld.type === "select") {
        const opts = (fld.opts || []).map((o) => `<option>${o}</option>`).join("");
        return `          <label>${fld.label}</label><select id="f-${fld.id}">${opts}</select>`;
      }
      const t = fld.type === "number" ? "number" : "text";
      return `          <label>${fld.label}</label><input id="f-${fld.id}" type="${t}" placeholder="${fld.ph || ""}" ${fld.type === "number" && fld.ph ? `value="${fld.ph}"` : ""}>`;
    })
    .join("\n");
}

function appJs(a) {
  const meta = {
    brand: a.brand,
    kind: a.kind,
    angle: a.angle,
    nav: a.nav.map((n) => n[0]),
    fields: a.fields,
    seeds: a.seeds,
    ai: a.ai,
    tips: a.tips,
    metrics: a.metrics,
    key: a.key
  };
  const inputs = fieldInputs(a.fields);
  return `"use strict";
(function () {
  const META = ${JSON.stringify(meta, null, 2)};
  const KEY = META.key;
  const state = VQ.load(KEY, { items: [], ideas: [], links: [], log: [], score: {} });

  function save() { VQ.store(KEY, state); render(); }
  function host(id) { return document.getElementById("view-" + id); }
  function kpi(rows) {
    return '<div class="kpi-row">' + rows.map((r) =>
      '<div class="card"><div class="stat"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div></div>'
    ).join("") + "</div>";
  }
  function readFields() {
    const row = { at: Date.now(), score: 50 + Math.floor(Math.random() * 40) };
    META.fields.forEach((fld) => {
      const el = document.getElementById("f-" + fld.id);
      if (!el) return;
      row[fld.id] = fld.type === "number" ? (+el.value || 0) : el.value;
    });
    return row;
  }
  function primaryLabel(row) {
    const f0 = META.fields[0];
    return f0 ? String(row[f0.id] || "Untitled") : "Untitled";
  }
  function secondaryLabel(row) {
    const bits = META.fields.slice(1, 3).map((fld) => row[fld.id]).filter((x) => x !== undefined && x !== "");
    return bits.join(" · ");
  }
  function metricVals() {
    const n = state.items.length;
    const avg = n ? Math.round(VQKit.avg(state.items.map((x) => +x.score || 0))) : "-";
    const ideas = state.ideas.length;
    const links = state.links.length;
    return [
      [META.metrics[0] || "Items", n],
      [META.metrics[1] || "Ideas", ideas],
      [META.metrics[2] || "Links", links],
      [META.metrics[3] || "Avg", avg]
    ];
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

  function renderPrimary() {
    const id = META.nav[0];
    host(id).innerHTML = kpi(metricVals()) + \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Add · \${META.brand}</h2>
${inputs}
          <div class="actions"><button class="primary" id="btn-add" type="button">Add</button></div>
        </div>
        <div class="card">
          <h2>Board</h2>
          <ul class="list" id="item-list"></ul>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <h2>Distribution</h2>
        <div id="dist-bars"></div>
        <div id="dist-spark" style="margin-top:10px"></div>
      </div>\`;
    document.getElementById("item-list").innerHTML = state.items.map((row, i) =>
      '<li><div><strong>' + VQKit.escape(primaryLabel(row)) + '</strong><br><span class="muted">' +
      VQKit.escape(secondaryLabel(row)) + '</span></div><div><span class="badge">' + (row.score || "-") +
      '</span> <button data-x="' + i + '" type="button">Del</button></div></li>'
    ).join("") || "<div class='empty'>Seed demo or add rows</div>";
    document.querySelectorAll("#item-list [data-x]").forEach((b) => {
      b.onclick = () => { state.items.splice(+b.dataset.x, 1); save(); };
    });
    document.getElementById("btn-add").onclick = () => {
      state.items.unshift(readFields());
      state.log.unshift({ at: Date.now(), text: "Added " + primaryLabel(state.items[0]) });
      save();
      VQ.toast("Saved");
    };
    const groupKey = META.fields[1] ? META.fields[1].id : META.fields[0].id;
    const mix = VQKit.groupCount(state.items, (r) => String(r[groupKey] || "—"));
    document.getElementById("dist-bars").innerHTML = VQKit.barChart(mix);
    document.getElementById("dist-spark").innerHTML = VQKit.sparkline(
      state.items.length ? state.items.map((x) => +x.score || 0).slice(0, 24).reverse() : [10, 20, 18, 30, 28, 40],
      280, 48, "#5fd4b3"
    );
  }

  function renderSecondary() {
    const id = META.nav[1];
    host(id).innerHTML = \`
      <div class="grid grid-2">
        <div class="card">
          <h2>AI / idea backlog</h2>
          <ul class="list" id="idea-list"></ul>
          <div class="actions"><button type="button" id="btn-idea">Pin tip</button></div>
        </div>
        <div class="card">
          <h2>Angle tips · \${META.angle}</h2>
          <ul class="list" id="tip-list"></ul>
          <div id="tip-donut" style="margin-top:12px"></div>
        </div>
      </div>\`;
    document.getElementById("idea-list").innerHTML = state.ideas.map((t, i) =>
      '<li><div>' + VQKit.escape(t) + '</div><button data-x="' + i + '" type="button">Del</button></li>'
    ).join("") || "<div class='empty'>Run AI for ideas</div>";
    document.querySelectorAll("#idea-list [data-x]").forEach((b) => {
      b.onclick = () => { state.ideas.splice(+b.dataset.x, 1); save(); };
    });
    document.getElementById("btn-idea").onclick = () => {
      const tip = META.tips[state.ideas.length % META.tips.length] || "Review board";
      state.ideas.unshift(tip);
      save();
    };
    document.getElementById("tip-list").innerHTML = META.tips.map((t) =>
      '<li><div>' + VQKit.escape(t) + '</div><span class="badge">tip</span></li>'
    ).join("");
    const tone = { ideas: state.ideas.length || 1, items: state.items.length || 1, links: state.links.length || 1 };
    document.getElementById("tip-donut").innerHTML = VQKit.donut(tone, 140);
  }

  function renderTertiary() {
    const id = META.nav[2];
    host(id).innerHTML = \`
      <div class="grid grid-2">
        <div class="card">
          <h2>Export / links</h2>
          <pre class="preview" id="export-pre"></pre>
          <div class="actions">
            <button type="button" id="btn-csv">CSV</button>
            <button type="button" id="btn-json">JSON</button>
            <button type="button" id="btn-link">Pin workspace link</button>
          </div>
          <ul class="list" id="link-list"></ul>
        </div>
        <div class="card">
          <h2>Activity</h2>
          <ul class="list" id="log-list"></ul>
          <div id="hist" style="margin-top:12px"></div>
        </div>
      </div>\`;
    document.getElementById("export-pre").textContent = state.items.slice(0, 12).map((row) =>
      META.fields.map((fld) => fld.id + "=" + row[fld.id]).join(" | ")
    ).join("\\n") || "Empty";
    document.getElementById("btn-csv").onclick = () => {
      const cols = META.fields.map((fld) => ({ label: fld.id, key: fld.id }));
      cols.push({ label: "score", key: "score" });
      VQKit.downloadCSV(META.brand.toLowerCase() + ".csv", state.items, cols);
    };
    document.getElementById("btn-json").onclick = () => {
      VQ.downloadJSON(META.brand.toLowerCase() + ".json", { brand: META.brand, angle: META.angle, items: state.items, ideas: state.ideas });
    };
    document.getElementById("btn-link").onclick = () => {
      state.links.unshift({ at: Date.now(), path: META.brand + " · " + META.angle });
      save();
      VQ.toast("Pinned");
    };
    document.getElementById("link-list").innerHTML = state.links.map((l) =>
      '<li><div>' + VQKit.escape(l.path) + '</div><span class="badge">' + VQKit.relativeTime(l.at) + '</span></li>'
    ).join("") || "<div class='empty'>No pins</div>";
    document.getElementById("log-list").innerHTML = state.log.slice(0, 10).map((l) =>
      '<li><div>' + VQKit.escape(l.text) + '</div><span class="badge">' + VQKit.relativeTime(l.at) + '</span></li>'
    ).join("") || "<div class='empty'>No activity</div>";
    document.getElementById("hist").innerHTML = VQKit.histogram(state.items.map((x) => Math.min(5, Math.round((+x.score || 0) / 20))), 5);
  }

  function render() {
    renderPrimary();
    renderSecondary();
    renderTertiary();
  }

  async function runAI() {
    document.getElementById("btn-primary").disabled = true;
    await VQ.think(480);
    META.ai.forEach((line) => {
      if (!state.ideas.includes(line)) state.ideas.unshift(line);
    });
    if (!state.items.length) {
      state.items = META.seeds.map((s) => Object.assign({ at: Date.now() }, s));
    } else {
      state.items.forEach((row, i) => {
        row.score = Math.min(100, (+row.score || 50) + (i % 3) * 2);
      });
    }
    state.log.unshift({ at: Date.now(), text: "AI pass on " + META.brand });
    document.getElementById("btn-primary").disabled = false;
    if (VQKit.activity && VQKit.activity.push) VQKit.activity.push(META.brand, "AI run");
    save();
    VQ.toast("AI complete");
  }

  function seed() {
    if (!state.items.length) state.items = META.seeds.map((s) => Object.assign({ at: Date.now() }, s));
    META.tips.slice(0, 2).forEach((t) => { if (!state.ideas.includes(t)) state.ideas.push(t); });
    state.log.unshift({ at: Date.now(), text: "Seeded " + META.brand });
    save();
    VQ.toast("Demo seeded");
  }

  document.getElementById("btn-primary").onclick = runAI;
  document.getElementById("btn-seed").onclick = seed;
  render();
  if (VQKit.bindExportButton) {
    VQKit.bindExportButton("Export " + META.brand, META.brand.toLowerCase() + "-state.json", () => state);
  }
})();
`;
}

function featuresJs(a) {
  return `"use strict";
(async function () {
  if (!window.VQKit) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "app-kit.js";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const KEY = ${JSON.stringify(a.key + "_pro")};
  const CORE = ${JSON.stringify(a.key)};
  const BRAND = ${JSON.stringify(a.brand)};
  const ANGLE = ${JSON.stringify(a.angle)};
  const TIPS = ${JSON.stringify(a.tips)};
  const state = VQ.load(KEY, { snapshots: [], notes: [], rituals: [], scorecard: [] });

  function ensure() {
    if (document.getElementById("pro-extra")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "pro-extra";
    el.className = "card pro-panel";
    el.innerHTML = \`
      <h2>\${BRAND} pro desk</h2>
      <p class="mini" style="margin-top:-6px">Angle: \${ANGLE} · standalone pack</p>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Snapshots</span><strong id="px1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Notes</span><strong id="px2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Rituals</span><strong id="px3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Scorecards</span><strong id="px4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="px-snap">Snapshot</button>
        <button type="button" id="px-note">Ops note</button>
        <button type="button" id="px-ritual">Weekly ritual</button>
        <button type="button" id="px-score">Scorecard+</button>
        <button type="button" id="px-csv">Export notes</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Snapshots</h3>
          <ul class="list" id="px-snaps"></ul>
          <div id="px-spark"></div>
        </div>
        <div>
          <h3>Ops + rituals</h3>
          <ul class="list" id="px-notes"></ul>
          <ul class="list" id="px-rituals"></ul>
          <div id="px-bars" style="margin-top:10px"></div>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <h3>Scorecard history</h3>
        <ul class="list" id="px-scores"></ul>
      </div>\`;
    main.appendChild(el);
    document.getElementById("px-snap").onclick = () => {
      const core = VQ.load(CORE, {});
      state.snapshots.unshift({ at: Date.now(), bytes: JSON.stringify(core).length });
      VQ.store(KEY, state); paint(); VQ.toast("Snapshot");
    };
    document.getElementById("px-note").onclick = () => {
      state.notes.unshift({ at: Date.now(), text: "Reviewed " + BRAND + " · " + (TIPS[0] || "board") });
      VQ.store(KEY, state); paint();
    };
    document.getElementById("px-ritual").onclick = () => {
      state.rituals.unshift({ at: Date.now(), text: "Weekly: " + (TIPS[state.rituals.length % TIPS.length] || "review") });
      VQ.store(KEY, state); paint(); VQ.toast("Ritual logged");
    };
    document.getElementById("px-score").onclick = () => {
      const core = VQ.load(CORE, { items: [] });
      const n = (core.items || []).length;
      const avg = n ? Math.round(VQKit.avg(core.items.map((x) => +x.score || 0))) : 0;
      state.scorecard.unshift({ at: Date.now(), n, avg, grade: avg >= 75 ? "A" : avg >= 55 ? "B" : "C" });
      VQ.store(KEY, state); paint();
    };
    document.getElementById("px-csv").onclick = () => {
      VQKit.downloadCSV(BRAND.toLowerCase() + "-ops.csv", state.notes, [
        { label: "at", get: (r) => VQKit.fmtDate(r.at) },
        { label: "text", key: "text" }
      ]);
    };
  }

  function paint() {
    ensure();
    document.getElementById("px1").textContent = state.snapshots.length;
    document.getElementById("px2").textContent = state.notes.length;
    document.getElementById("px3").textContent = state.rituals.length;
    document.getElementById("px4").textContent = state.scorecard.length;
    document.getElementById("px-snaps").innerHTML = state.snapshots.slice(0, 6).map((s) =>
      '<li><div>' + s.bytes + ' bytes</div><span class="badge">' + VQKit.relativeTime(s.at) + '</span></li>'
    ).join("") || "<div class='empty'>No snapshots</div>";
    document.getElementById("px-notes").innerHTML = state.notes.slice(0, 5).map((n) =>
      '<li><div>' + VQKit.escape(n.text) + '</div></li>'
    ).join("") || "<div class='empty'>No notes</div>";
    document.getElementById("px-rituals").innerHTML = state.rituals.slice(0, 5).map((n) =>
      '<li><div>' + VQKit.escape(n.text) + '</div><span class="badge">ritual</span></li>'
    ).join("") || "<div class='empty'>No rituals</div>";
    document.getElementById("px-scores").innerHTML = state.scorecard.slice(0, 8).map((s) =>
      '<li><div><strong>' + s.grade + '</strong> · n=' + s.n + ' avg=' + s.avg + '</div><span class="badge">' + VQKit.relativeTime(s.at) + '</span></li>'
    ).join("") || "<div class='empty'>Run scorecard</div>";
    document.getElementById("px-spark").innerHTML = VQKit.sparkline(
      state.snapshots.length ? state.snapshots.map((s) => s.bytes).reverse() : [20, 40, 35, 60],
      220, 40, "#5fd4b3"
    );
    document.getElementById("px-bars").innerHTML = VQKit.barChart({
      snaps: state.snapshots.length || 1,
      notes: state.notes.length || 1,
      rituals: state.rituals.length || 1,
      scores: state.scorecard.length || 1
    });
  }
  paint();
})();
`;
}

function productJson(a) {
  return JSON.stringify(
    {
      id: a.dir,
      brand: a.brand,
      sub: a.sub,
      angle: a.angle,
      standalone: true,
      version: "1.0.0"
    },
    null,
    2
  );
}

// Guard: no AI_ / GAME_ in folder names
for (const a of APPS) {
  if (/_(AI|GAME)_|^AI_|^GAME_|AI GAME|GAME AI/i.test(a.dir)) {
    throw new Error("Forbidden folder name: " + a.dir);
  }
}

let n = 0;
for (const a of APPS) {
  const dest = path.join(ROOT, a.dir);
  fs.mkdirSync(path.join(dest, "src"), { recursive: true });
  copyLibs(dest);
  fs.writeFileSync(path.join(dest, "index.html"), indexHtml(a), "utf8");
  fs.writeFileSync(path.join(dest, "strings.js"), stringsJs(a), "utf8");
  fs.writeFileSync(path.join(dest, "app.js"), appJs(a), "utf8");
  fs.writeFileSync(path.join(dest, "features.js"), featuresJs(a), "utf8");
  fs.writeFileSync(path.join(dest, "product.json"), productJson(a), "utf8");
  fs.writeFileSync(path.join(dest, "src", ".gitkeep"), "", "utf8");
  n += 1;
  console.log("created", a.dir, "·", a.angle, "·", a.brand);
}
console.log("done", n);
if (n !== 50) console.warn("expected 50, got", n);
