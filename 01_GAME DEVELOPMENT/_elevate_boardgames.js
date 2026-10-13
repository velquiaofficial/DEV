"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "14_BOARDGAME");
const themes = {
  "02_GLINTBAZAAR": { bg: "#0a1418", ink: "#e8f2f0", muted: "#8aa8a0", accent: "#78c4b8", accent2: "#e8b84a", panel: "#122428", glow: "rgba(120,196,184,.18)" },
  "03_RAILSPAN": { bg: "#101418", ink: "#eef2f4", muted: "#8a96a0", accent: "#6aa3c8", accent2: "#d4a574", panel: "#1a2228", glow: "rgba(106,163,200,.18)" },
  "04_MOSAICCOURT": { bg: "#141210", ink: "#f3eee6", muted: "#a89888", accent: "#c4a574", accent2: "#7a9e8e", panel: "#221e18", glow: "rgba(196,165,116,.18)" },
  "05_CROWNSTACK": { bg: "#121018", ink: "#f0eef6", muted: "#9a96a8", accent: "#c9a86c", accent2: "#7eb0a8", panel: "#1e1a28", glow: "rgba(201,168,108,.18)" }
};
for (const [name, t] of Object.entries(themes)) {
  const p = path.join(root, name, "style.css");
  if (!fs.existsSync(p)) continue;
  let css = fs.readFileSync(p, "utf8");
  css = css
    .replace(/#3a2460/gi, t.panel)
    .replace(/#120f1a/gi, t.bg)
    .replace(/#0b0a10/gi, t.bg)
    .replace(/#c9a6ff/gi, t.accent)
    .replace(/#a78bfa/gi, t.accent)
    .replace(/#7c5cff/gi, t.accent2)
    .replace(/#2a2140/gi, t.panel)
    .replace(/#1c1628/gi, t.panel)
    .replace(/#f4eefc/gi, t.ink)
    .replace(/#9b8fb0/gi, t.muted);
  if (!css.includes("/* board-elevate */")) {
    css += `\n/* board-elevate */\nbody{background:radial-gradient(ellipse 70% 50% at 50% -10%,${t.glow},transparent),${t.bg}!important}\n.eyebrow{color:${t.accent}!important}\n.shell{animation:br .6s ease both}@keyframes br{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}\n`;
  }
  fs.writeFileSync(p, css);
  console.log("themed", name);
}
