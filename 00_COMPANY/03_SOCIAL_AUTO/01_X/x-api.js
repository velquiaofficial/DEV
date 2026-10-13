"use strict";

const https = require("https");
const { loadConfig, upsertEnvKeys } = require("../shared/load-config");

function request(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (_) {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, json, raw: data });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function refreshOAuth2(x) {
  if (!x.client_id || !x.client_secret || !x.oauth2_refresh_token) {
    throw new Error("OAuth 2.0 refresh に Client ID/Secret と Refresh Token が必要です。");
  }
  const basic = Buffer.from(
    x.client_id.trim() + ":" + x.client_secret.trim()
  ).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: x.oauth2_refresh_token.trim(),
    client_id: x.client_id.trim()
  }).toString();
  const result = await request(
    "POST",
    "https://api.twitter.com/2/oauth2/token",
    {
      Authorization: "Basic " + basic,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
      "User-Agent": "VELQUIA-SocialAuto/0.1"
    },
    body
  );
  if (result.status < 200 || result.status >= 300 || !result.json.access_token) {
    throw new Error(
      "OAuth 2.0 refresh failed (HTTP " +
        result.status +
        "): " +
        JSON.stringify(result.json)
    );
  }
  const updates = {
    X_OAUTH2_ACCESS_TOKEN: result.json.access_token
  };
  if (result.json.refresh_token) {
    updates.X_OAUTH2_REFRESH_TOKEN = result.json.refresh_token;
  }
  upsertEnvKeys(updates);
  x.oauth2_access_token = result.json.access_token;
  if (result.json.refresh_token) {
    x.oauth2_refresh_token = result.json.refresh_token;
  }
  return x.oauth2_access_token;
}

async function getUserAccessToken(x) {
  if (x.oauth2_access_token) return x.oauth2_access_token.trim();
  if (x.oauth2_refresh_token) return refreshOAuth2(x);
  throw new Error("shared/.env に X_OAUTH2_ACCESS_TOKEN がありません。");
}

async function createTweet(text, options) {
  const config = loadConfig();
  const x = config.x || {};
  let token = await getUserAccessToken(x);
  const body = JSON.stringify({ text });
  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "User-Agent": "VELQUIA-SocialAuto/0.1"
  };

  let result = await request(
    "POST",
    "https://api.twitter.com/2/tweets",
    headers,
    body
  );

  if (
    (result.status === 401 || result.status === 403) &&
    x.oauth2_refresh_token &&
    !(options && options.skipRefresh)
  ) {
    token = await refreshOAuth2(x);
    headers.Authorization = "Bearer " + token;
    result = await request(
      "POST",
      "https://api.twitter.com/2/tweets",
      headers,
      body
    );
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      "tweet failed (HTTP " + result.status + "): " + JSON.stringify(result.json)
    );
  }
  return result.json;
}

module.exports = {
  createTweet,
  refreshOAuth2,
  loadConfig
};
