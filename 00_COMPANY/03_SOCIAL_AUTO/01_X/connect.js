"use strict";

/**
 * Test connection to X API using credentials in shared/.env
 *
 * Portal copy-button → shared/.env:
 * - X_API_KEY / X_API_SECRET
 * - X_BEARER_TOKEN
 * - X_CLIENT_ID / X_CLIENT_SECRET
 * - X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET          (OAuth 1.0a)
 * - X_OAUTH2_ACCESS_TOKEN / X_OAUTH2_REFRESH_TOKEN  (OAuth 2.0 user)
 */

const https = require("https");
const crypto = require("crypto");
const { loadConfig } = require("../shared/load-config");

function request(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) { json = { raw: data }; }
        resolve({ status: res.statusCode, json, raw: data });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function oauthHeader(method, url, apiKey, apiSecret, token, tokenSecret, extra) {
  const oauth = Object.assign({
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0"
  }, extra || {});
  if (token) oauth.oauth_token = token;

  const params = Object.assign({}, oauth);
  const u = new URL(url);
  u.searchParams.forEach((value, key) => { params[key] = value; });

  const paramStr = Object.keys(params)
    .sort()
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
  const base = [
    method.toUpperCase(),
    encodeURIComponent(u.origin + u.pathname),
    encodeURIComponent(paramStr)
  ].join("&");
  const signingKey = encodeURIComponent(apiSecret) + "&" + encodeURIComponent(tokenSecret || "");
  oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  return "OAuth " + Object.keys(oauth)
    .sort()
    .map((k) => encodeURIComponent(k) + "=\"" + encodeURIComponent(oauth[k]) + "\"")
    .join(", ");
}

async function main() {
  const config = loadConfig();
  const x = config.x || {};
  const missing = ["api_key", "api_secret", "bearer_token"].filter((k) => !x[k]);
  if (missing.length) {
    throw new Error(
      "shared/.env の X_" + missing.join(", X_").toUpperCase() + " が空です。" +
      " Developer Portal のコピーボタンから shared/.env に貼ってください。"
    );
  }

  console.log("[x] checking Bearer token...");
  // Portal copy may include %2F / %3D — use the string as copied, do not decode.
  const bearerToken = String(x.bearer_token).trim();
  const bearerResult = await request(
    "GET",
    "https://api.twitter.com/1.1/application/rate_limit_status.json",
    {
      Authorization: "Bearer " + bearerToken,
      "User-Agent": "VELQUIA-SocialAuto/0.1"
    }
  );

  if (bearerResult.status >= 200 && bearerResult.status < 300) {
    console.log("[x] Bearer OK (HTTP " + bearerResult.status + ")");
  } else if (bearerResult.status === 402) {
    console.log("[x] Bearer accepted, but API credits are depleted (HTTP 402).");
  } else {
    console.error("[x] Bearer failed (HTTP " + bearerResult.status + ")");
    console.error(JSON.stringify(bearerResult.json, null, 2));
    process.exitCode = 1;
  }

  console.log("[x] checking Consumer Key / Secret via OAuth request_token...");
  const oauthResult = await request(
    "POST",
    "https://api.twitter.com/oauth/request_token",
    {
      Authorization: oauthHeader(
        "POST",
        "https://api.twitter.com/oauth/request_token",
        x.api_key.trim(),
        x.api_secret.trim(),
        "",
        "",
        { oauth_callback: "oob" }
      ),
      "User-Agent": "VELQUIA-SocialAuto/0.1",
      "Content-Length": "0"
    }
  );

  if (oauthResult.status >= 200 && oauthResult.status < 300) {
    console.log("[x] Consumer Key / Secret OK (HTTP " + oauthResult.status + ")");
  } else {
    console.error("[x] Consumer Key / Secret failed (HTTP " + oauthResult.status + ")");
    console.error(oauthResult.raw.slice(0, 300));
    process.exitCode = 1;
  }

  if (x.client_id && x.client_secret) {
    console.log("[x] checking OAuth 2.0 Client ID / Secret...");
    const basic = Buffer.from(x.client_id.trim() + ":" + x.client_secret.trim()).toString("base64");
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: x.client_id.trim(),
      client_secret: x.client_secret.trim()
    }).toString();
    const tokenResult = await request(
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
    if (tokenResult.status >= 200 && tokenResult.status < 300 && tokenResult.json.access_token) {
      console.log("[x] OAuth 2.0 Client ID / Secret OK");
    } else {
      // User-auth / PKCE apps often reject client_credentials; values are still saved.
      console.log("[x] OAuth 2.0 Client ID / Secret saved");
      console.log("[x] (client_credentials HTTP " + tokenResult.status + " — posting still uses Access Token)");
    }
  } else {
    console.log("[x] OAuth 2.0 Client ID / Secret 未設定");
  }

  let userOk = false;

  if (x.access_token && x.access_token_secret) {
    console.log("[x] checking OAuth 1.0a Access Token...");
    const me = await request(
      "GET",
      "https://api.twitter.com/2/users/me",
      {
        Authorization: oauthHeader(
          "GET",
          "https://api.twitter.com/2/users/me",
          x.api_key.trim(),
          x.api_secret.trim(),
          x.access_token.trim(),
          x.access_token_secret.trim()
        ),
        "User-Agent": "VELQUIA-SocialAuto/0.1"
      }
    );
    if (me.status >= 200 && me.status < 300) {
      const user = me.json && me.json.data ? me.json.data : {};
      console.log("[x] OAuth 1.0a user OK @" + (user.username || "?") + " (" + (user.name || "") + ")");
      userOk = true;
    } else {
      console.log("[x] OAuth 1.0a user token failed (HTTP " + me.status + ")");
    }
  } else {
    console.log("[x] OAuth 1.0a Access Token / Secret 未設定");
  }

  if (x.oauth2_access_token) {
    console.log("[x] checking OAuth 2.0 user Access Token...");
    const me2 = await request(
      "GET",
      "https://api.twitter.com/2/users/me",
      {
        Authorization: "Bearer " + String(x.oauth2_access_token).trim(),
        "User-Agent": "VELQUIA-SocialAuto/0.1"
      }
    );
    if (me2.status >= 200 && me2.status < 300) {
      const user = me2.json && me2.json.data ? me2.json.data : {};
      console.log("[x] OAuth 2.0 user OK @" + (user.username || "?") + " (" + (user.name || "") + ")");
      userOk = true;
    } else {
      console.error("[x] OAuth 2.0 user token failed (HTTP " + me2.status + ")");
      console.error(JSON.stringify(me2.json, null, 2));
    }
  } else {
    console.log("[x] OAuth 2.0 user Access Token 未設定");
  }

  if (!userOk) {
    process.exitCode = 1;
    console.log("[x] 投稿には OAuth 1.0a か OAuth 2.0 のどちらかのユーザートークンが必要です。");
    console.log("[x] 失敗時: Portal の値を shared/.env にコピーボタンで貼り直してください。");
  } else {
    console.log("[x] connection ready");
  }
}

main().catch((error) => {
  console.error("[x]", error.message);
  process.exitCode = 1;
});
