"use strict";

/**
 * X (Twitter) auto-post.
 * Credentials: shared/.env
 *
 * Usage:
 *   node post.js --text "hello"
 *   node post.js                 (process queue/*.json)
 */

const fs = require("fs");
const path = require("path");
const { loadConfig, createTweet } = require("./x-api");

const QUEUE_DIR = path.join(__dirname, "queue");
const LOG_DIR = path.join(__dirname, "logs");
const DONE_DIR = path.join(QUEUE_DIR, "done");

function listQueue() {
  if (!fs.existsSync(QUEUE_DIR)) return [];
  return fs
    .readdirSync(QUEUE_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(QUEUE_DIR, name));
}

function argText() {
  const idx = process.argv.indexOf("--text");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

function writeLog(entry) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(LOG_DIR, stamp + ".json");
  fs.writeFileSync(file, JSON.stringify(entry, null, 2), "utf8");
  return file;
}

async function main() {
  const config = loadConfig();
  if (!config.x || !config.x.enabled) {
    console.log("[x] disabled — set X_ENABLED=true in shared/.env when ready.");
    return;
  }

  const direct = argText();
  if (direct !== null) {
    console.log("[x] posting text (" + [...direct].length + " chars)...");
    const result = await createTweet(direct);
    const id = result.data && result.data.id;
    console.log("[x] posted", id ? "https://x.com/i/web/status/" + id : result);
    writeLog({ ok: true, id, text: direct, result });
    return;
  }

  const queued = listQueue();
  if (queued.length === 0) {
    console.log("[x] queue is empty. Use: node post.js --text \"...\"");
    return;
  }

  fs.mkdirSync(DONE_DIR, { recursive: true });
  for (const file of queued) {
    const post = JSON.parse(fs.readFileSync(file, "utf8"));
    const text = post.text || post.caption || "";
    if (!text) {
      console.error("[x] skip (no text):", path.basename(file));
      continue;
    }
    console.log("[x] publishing:", post.id || path.basename(file));
    const result = await createTweet(text);
    const id = result.data && result.data.id;
    console.log("[x] posted", id ? "https://x.com/i/web/status/" + id : result);
    writeLog({ ok: true, id, file, text, result });
    const dest = path.join(DONE_DIR, path.basename(file));
    fs.renameSync(file, dest);
  }
}

main().catch((error) => {
  console.error("[x]", error.message);
  writeLog({ ok: false, error: error.message });
  process.exitCode = 1;
});
