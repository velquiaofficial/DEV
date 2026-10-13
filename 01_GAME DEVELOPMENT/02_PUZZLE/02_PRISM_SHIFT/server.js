"use strict";
/**
 * Per-game local static server — this folder only. No shared control panel.
 * Usage: node server.js   or start-server.bat
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const here = __dirname;
const root = fs.existsSync(path.join(here, "public", "index.html"))
  ? path.join(here, "public")
  : here;
const portFile = path.join(here, "port.txt");
const PORT = Number(process.env.PORT || (fs.existsSync(portFile) ? fs.readFileSync(portFile, "utf8").trim() : 0) || 5103);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".ico": "image/x-icon"
};

function safeJoin(base, reqPath) {
  const decoded = decodeURIComponent((reqPath || "/").split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(base, cleaned);
  if (!full.startsWith(base)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  let filePath = safeJoin(root, req.url === "/" ? "/index.html" : req.url);
  if (!filePath) { res.writeHead(403); res.end("Forbidden"); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  const url = "http://127.0.0.1:" + PORT + "/";
  console.log("");
  console.log("  " + path.basename(here));
  console.log("  root: " + root);
  console.log("  " + url);
  console.log("  (this game only — no shared panel)");
  console.log("");
  if (process.env.VQ_OPEN === "1") {
    const cmd = process.platform === "win32" ? 'start "" "' + url + '"' : "xdg-open " + url;
    exec(cmd);
  }
});
