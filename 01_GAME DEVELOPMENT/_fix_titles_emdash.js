"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
let n = 0;
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isDirectory() || !/^\d{3}_/.test(ent.name)) continue;
  const num = +ent.name.split("_")[0];
  if (num < 101 || num > 315) continue;
  const html = path.join(ROOT, ent.name, "index.html");
  if (!fs.existsSync(html)) continue;
  const brand = ent.name.slice(ent.name.indexOf("_") + 1);
  let s = fs.readFileSync(html, "utf8");
  const t = s
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${brand} \u2014 VELQUIA</title>`)
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${brand}</h1>`);
  if (t !== s) {
    fs.writeFileSync(html, t, "utf8");
    n++;
  }
}
console.log("fixed", n);
console.log(fs.readFileSync(path.join(ROOT, "101_LUMENMAW", "index.html"), "utf8").match(/<title>.*?<\/title>/)[0]);
