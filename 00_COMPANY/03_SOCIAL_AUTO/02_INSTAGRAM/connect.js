"use strict";

/**
 * Test Instagram Graph API credentials in shared/.env
 *
 * Required (Meta Developer + Instagram professional account):
 * - IG_APP_ID
 * - IG_APP_SECRET
 * - IG_ACCESS_TOKEN   (long-lived Page / User token with instagram scopes)
 * - IG_USER_ID        (Instagram Business/Creator user id)
 */

const https = require("https");
const { loadConfig } = require("../shared/load-config");

function request(method, url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: { "User-Agent": "VELQUIA-SocialAuto/0.1" }
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
          resolve({ status: res.statusCode, json });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const config = loadConfig();
  const ig = config.instagram || {};
  const missing = ["app_id", "app_secret", "access_token", "ig_user_id"].filter(
    (k) => !ig[k]
  );

  if (missing.length) {
    const envName = {
      app_id: "IG_APP_ID",
      app_secret: "IG_APP_SECRET",
      access_token: "IG_ACCESS_TOKEN",
      ig_user_id: "IG_USER_ID"
    };
    console.log("[instagram] shared/.env が未設定です:");
    for (const key of missing) {
      console.log("  - " + (envName[key] || key));
    }
    console.log("");
    console.log("[instagram] 準備手順:");
    console.log("  1. Instagram をプロアカウント（ビジネス/クリエイター）にする");
    console.log("  2. Facebook ページと Instagram を連携する");
    console.log("  3. Meta for Developers でアプリ作成 → Instagram Graph API 追加");
    console.log("  4. 長期アクセストークンと Instagram ユーザー ID を取得");
    console.log("  5. shared/.env に貼って IG_ENABLED=true");
    console.log("  6. node connect.js を再実行");
    process.exitCode = 1;
    return;
  }

  console.log("[instagram] checking user...");
  const fields = "id,username,name,profile_picture_url";
  const me = await request(
    "GET",
    "https://graph.facebook.com/v21.0/" +
      encodeURIComponent(ig.ig_user_id.trim()) +
      "?fields=" +
      fields +
      "&access_token=" +
      encodeURIComponent(ig.access_token.trim())
  );

  if (me.status >= 200 && me.status < 300 && me.json && me.json.id) {
    console.log(
      "[instagram] OK @" +
        (me.json.username || "?") +
        " (" +
        (me.json.name || "") +
        ") id=" +
        me.json.id
    );
    console.log("[instagram] connection ready");
  } else {
    console.error("[instagram] failed (HTTP " + me.status + ")");
    console.error(JSON.stringify(me.json, null, 2));
    console.log("[instagram] トークン権限・IG_USER_ID・ページ連携を確認してください。");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[instagram]", error.message);
  process.exitCode = 1;
});
