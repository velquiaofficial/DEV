"use strict";

/**
 * Load Social Auto settings from shared/.env (secrets) with optional
 * shared/config.json overrides for non-secret flags.
 */

const fs = require("fs");
const path = require("path");

const SHARED_DIR = __dirname;
const ENV_PATH = path.join(SHARED_DIR, ".env");
const CONFIG_PATH = path.join(SHARED_DIR, "config.json");

function parseEnv(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return {};
  return parseEnv(fs.readFileSync(ENV_PATH, "utf8"));
}

function flag(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

function loadConfig() {
  const env = Object.assign({}, readEnvFile(), process.env);
  let file = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      file = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch (_) {
      file = {};
    }
  }

  const xFile = file.x || {};
  const igFile = file.instagram || {};

  return {
    timezone: env.TIMEZONE || file.timezone || "Asia/Tokyo",
    x: {
      enabled: flag(env.X_ENABLED, xFile.enabled === true),
      api_key: env.X_API_KEY || xFile.api_key || "",
      api_secret: env.X_API_SECRET || xFile.api_secret || "",
      bearer_token: env.X_BEARER_TOKEN || xFile.bearer_token || "",
      client_id: env.X_CLIENT_ID || xFile.client_id || "",
      client_secret: env.X_CLIENT_SECRET || xFile.client_secret || "",
      access_token: env.X_ACCESS_TOKEN || xFile.access_token || "",
      access_token_secret:
        env.X_ACCESS_TOKEN_SECRET || xFile.access_token_secret || "",
      oauth2_access_token:
        env.X_OAUTH2_ACCESS_TOKEN || xFile.oauth2_access_token || "",
      oauth2_refresh_token:
        env.X_OAUTH2_REFRESH_TOKEN || xFile.oauth2_refresh_token || ""
    },
    instagram: {
      enabled: flag(env.IG_ENABLED, igFile.enabled === true),
      app_id: env.IG_APP_ID || igFile.app_id || "",
      app_secret: env.IG_APP_SECRET || igFile.app_secret || "",
      access_token: env.IG_ACCESS_TOKEN || igFile.access_token || "",
      ig_user_id: env.IG_USER_ID || igFile.ig_user_id || ""
    }
  };
}

function upsertEnvKeys(updates) {
  const lines = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)
    : [];
  const seen = new Set();
  const next = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return line;
    }
    const key = trimmed.slice(0, trimmed.indexOf("=")).trim();
    if (!(key in updates)) return line;
    seen.add(key);
    return key + "=" + updates[key];
  });
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) next.push(key + "=" + value);
  }
  fs.writeFileSync(ENV_PATH, next.join("\n").replace(/\n*$/, "\n"), "utf8");
}

module.exports = {
  ENV_PATH,
  CONFIG_PATH,
  loadConfig,
  upsertEnvKeys
};
