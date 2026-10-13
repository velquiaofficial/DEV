"use strict";

/**
 * Instagram auto-post frame.
 * Credentials: shared/.env (see .env.example)
 */

const fs = require("fs");
const path = require("path");
const { loadConfig } = require("../shared/load-config");

const QUEUE_DIR = path.join(__dirname, "queue");
const LOG_DIR = path.join(__dirname, "logs");

function listQueue() {
  if (!fs.existsSync(QUEUE_DIR)) return [];
  return fs
    .readdirSync(QUEUE_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(QUEUE_DIR, name));
}

async function publishToInstagram(_config, _post) {
  // TODO: call Instagram Graph API here
  throw new Error("Instagram publish is not implemented yet (frame only).");
}

async function main() {
  const config = loadConfig();
  if (!config.instagram || !config.instagram.enabled) {
    console.log("[instagram] disabled — set IG_ENABLED=true in shared/.env when ready.");
    return;
  }

  const queued = listQueue();
  if (queued.length === 0) {
    console.log("[instagram] queue is empty.");
    return;
  }

  fs.mkdirSync(LOG_DIR, { recursive: true });
  for (const file of queued) {
    const post = JSON.parse(fs.readFileSync(file, "utf8"));
    console.log("[instagram] would publish:", post.id || path.basename(file));
    await publishToInstagram(config, post);
  }
}

main().catch((error) => {
  console.error("[instagram]", error.message);
  process.exitCode = 1;
});
