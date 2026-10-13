"use strict";

/**
 * VELQUIA App Kit — shared feature layer for apps 15–29
 * Search, filters, pagination, CSV, charts helpers, forms, activity log.
 */
(function (global) {
  const Kit = {};

  Kit.now = () => Date.now();
  Kit.dayKey = (ts) => new Date(ts || Date.now()).toISOString().slice(0, 10);
  Kit.fmtYen = (n) => "¥" + Math.round(Number(n) || 0).toLocaleString("ja-JP");
  Kit.fmtDate = (ts) => new Date(ts).toLocaleString("ja-JP");
  Kit.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Kit.escape = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  Kit.debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms || 200);
    };
  };

  Kit.search = (items, query, fields) => {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return items.slice();
    return items.filter((it) =>
      fields.some((f) =>
        String(typeof f === "function" ? f(it) : it[f] ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  };

  Kit.paginate = (items, page, perPage) => {
    const per = perPage || 8;
    const pages = Math.max(1, Math.ceil(items.length / per));
    const p = Kit.clamp(page || 1, 1, pages);
    const start = (p - 1) * per;
    return {
      page: p,
      pages,
      per,
      total: items.length,
      slice: items.slice(start, start + per)
    };
  };

  Kit.sortBy = (items, key, dir) => {
    const mul = dir === "desc" ? -1 : 1;
    return items.slice().sort((a, b) => {
      const av = typeof key === "function" ? key(a) : a[key];
      const bv = typeof key === "function" ? key(b) : b[key];
      if (av < bv) return -1 * mul;
      if (av > bv) return 1 * mul;
      return 0;
    });
  };

  Kit.groupCount = (items, keyFn) => {
    const map = {};
    items.forEach((it) => {
      const k = keyFn(it);
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  };

  Kit.sumBy = (items, keyFn) =>
    items.reduce((s, it) => s + (Number(keyFn(it)) || 0), 0);

  Kit.toCSV = (rows, headers) => {
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const head = headers.map((h) => esc(h.label)).join(",");
    const body = rows
      .map((r) => headers.map((h) => esc(typeof h.get === "function" ? h.get(r) : r[h.key])).join(","))
      .join("\n");
    return head + "\n" + body;
  };

  Kit.downloadCSV = (filename, rows, headers) => {
    const csv = Kit.toCSV(rows, headers);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  Kit.activity = {
    key: "vq_kit_activity",
    push(app, message, meta) {
      const list = Kit.activity.all();
      list.unshift({
        id: Math.random().toString(36).slice(2, 9),
        app,
        message,
        meta: meta || null,
        at: Date.now()
      });
      while (list.length > 200) list.pop();
      localStorage.setItem(Kit.activity.key, JSON.stringify(list));
      return list[0];
    },
    all() {
      try {
        return JSON.parse(localStorage.getItem(Kit.activity.key) || "[]");
      } catch (_) {
        return [];
      }
    },
    forApp(app) {
      return Kit.activity.all().filter((x) => x.app === app);
    }
  };

  Kit.renderPager = (el, pageInfo, onPage) => {
    if (!el) return;
    el.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "actions";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.textContent = "‹ Prev";
    prev.disabled = pageInfo.page <= 1;
    prev.onclick = () => onPage(pageInfo.page - 1);
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next ›";
    next.disabled = pageInfo.page >= pageInfo.pages;
    next.onclick = () => onPage(pageInfo.page + 1);
    const label = document.createElement("span");
    label.className = "mini";
    label.textContent = `${pageInfo.page} / ${pageInfo.pages} · ${pageInfo.total} items`;
    wrap.append(prev, label, next);
    el.appendChild(wrap);
  };

  Kit.sparkline = (values, w, h, color) => {
    const vals = values.length ? values : [0];
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const span = max - min || 1;
    const step = (w || 120) / Math.max(vals.length - 1, 1);
    const points = vals
      .map((v, i) => {
        const x = i * step;
        const y = (h || 36) - ((v - min) / span) * (h || 36);
        return x.toFixed(1) + "," + y.toFixed(1);
      })
      .join(" ");
    return `<svg width="${w || 120}" height="${h || 36}" viewBox="0 0 ${w || 120} ${h || 36}" aria-hidden="true"><polyline fill="none" stroke="${color || "#a594ff"}" stroke-width="2" points="${points}"/></svg>`;
  };

  Kit.barChart = (map, maxW) => {
    const entries = Object.entries(map);
    const max = Math.max(1, ...entries.map((e) => e[1]));
    return entries
      .map(([k, v]) => {
        const pct = Math.round((v / max) * 100);
        return `<div style="margin:8px 0"><div class="mini">${Kit.escape(k)} · ${v}</div><div class="bar-track" style="max-width:${maxW || 100}%"><div class="bar-fill" style="width:${pct}%"></div></div></div>`;
      })
      .join("") || '<div class="empty">No data</div>';
  };

  Kit.donut = (map, size) => {
    const entries = Object.entries(map);
    const total = entries.reduce((s, e) => s + e[1], 0) || 1;
    const s = size || 120;
    const r = s / 2 - 8;
    const c = s / 2;
    let angle = -Math.PI / 2;
    const colors = ["#6d4dff", "#a594ff", "#7ee0c6", "#e0b84a", "#ff8b6b", "#6ec6ff"];
    const parts = entries.map((e, i) => {
      const slice = (e[1] / total) * Math.PI * 2;
      const x1 = c + r * Math.cos(angle);
      const y1 = c + r * Math.sin(angle);
      angle += slice;
      const x2 = c + r * Math.cos(angle);
      const y2 = c + r * Math.sin(angle);
      const large = slice > Math.PI ? 1 : 0;
      return `<path d="M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"><title>${Kit.escape(e[0])}: ${e[1]}</title></path>`;
    });
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${parts.join("")}<circle cx="${c}" cy="${c}" r="${r * 0.55}" fill="#07070c"/></svg>`;
  };

  Kit.validate = {
    required(v, label) {
      if (v == null || String(v).trim() === "") return (label || "Field") + " is required";
      return "";
    },
    email(v) {
      if (!v) return "";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Invalid email";
    },
    min(v, n, label) {
      return Number(v) >= n ? "" : (label || "Value") + " must be ≥ " + n;
    }
  };

  Kit.mountSearchBar = (parent, placeholder, onChange) => {
    if (!parent || parent.querySelector("[data-kit-search]")) return;
    const input = document.createElement("input");
    input.setAttribute("data-kit-search", "1");
    input.placeholder = placeholder || "Search…";
    input.style.marginBottom = "10px";
    input.addEventListener(
      "input",
      Kit.debounce(() => onChange(input.value), 160)
    );
    parent.insertBefore(input, parent.firstChild);
    return input;
  };

  Kit.mountActivityPanel = (parent, appId) => {
    if (!parent || parent.querySelector("[data-kit-activity]")) return;
    const box = document.createElement("div");
    box.className = "card";
    box.setAttribute("data-kit-activity", "1");
    box.style.marginTop = "14px";
    const render = () => {
      const rows = Kit.activity.forApp(appId).slice(0, 12);
      box.innerHTML =
        "<h2>Activity</h2><ul class='list'>" +
        (rows
          .map(
            (r) =>
              `<li><div>${Kit.escape(r.message)}</div><span class="badge">${Kit.fmtDate(r.at)}</span></li>`
          )
          .join("") || "<li class='muted'>No activity yet</li>") +
        "</ul>";
    };
    parent.appendChild(box);
    render();
    return { refresh: render };
  };

  Kit.seedIfEmpty = (arr, seeder) => {
    if (!arr.length) seeder(arr);
    return arr;
  };

  Kit.weekSeries = (items, tsFn, valueFn) => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d.getTime());
    }
    return days.map((start) => {
      const end = start + 86400000;
      return items
        .filter((it) => {
          const t = tsFn(it);
          return t >= start && t < end;
        })
        .reduce((s, it) => s + (valueFn ? valueFn(it) : 1), 0);
    });
  };

  Kit.confirm = (msg) => global.confirm(msg);

  Kit.bindExportButton = (label, filename, getter) => {
    const foot = document.querySelector(".side-foot");
    if (!foot || foot.querySelector("[data-kit-export]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label || "Export";
    b.setAttribute("data-kit-export", "1");
    b.style.marginTop = "8px";
    b.onclick = () => {
      const data = getter();
      if (window.VQ && VQ.downloadJSON) VQ.downloadJSON(filename, data);
      Kit.activity.push("kit", "Exported " + filename);
      if (window.VQ) VQ.toast("Exported");
    };
    foot.appendChild(b);
  };

  /** Relative change label e.g. +12% */
  Kit.deltaLabel = (curr, prev) => {
    if (!prev) return "—";
    const pct = Math.round(((curr - prev) / Math.abs(prev)) * 100);
    return (pct >= 0 ? "+" : "") + pct + "%";
  };

  Kit.unique = (items, keyFn) => {
    const seen = new Set();
    return items.filter((it) => {
      const k = keyFn ? keyFn(it) : it;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  Kit.chunk = (items, size) => {
    const out = [];
    const n = Math.max(1, size || 10);
    for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n));
    return out;
  };

  Kit.avg = (nums) => {
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + Number(b || 0), 0) / nums.length;
  };

  Kit.percentile = (nums, p) => {
    if (!nums.length) return 0;
    const s = nums.slice().map(Number).sort((a, b) => a - b);
    const i = Kit.clamp(Math.floor((p / 100) * (s.length - 1)), 0, s.length - 1);
    return s[i];
  };

  Kit.heatmapTable = (rows, cols, valueFn, opts) => {
    let max = 1;
    rows.forEach((r) =>
      cols.forEach((c) => {
        max = Math.max(max, Number(valueFn(r, c)) || 0);
      })
    );
    const color = (opts && opts.color) || "109,77,255";
    let html = "<table class='table'><thead><tr><th></th>";
    html += cols.map((c) => "<th>" + Kit.escape(c) + "</th>").join("");
    html += "</tr></thead><tbody>";
    rows.forEach((r) => {
      html += "<tr><th>" + Kit.escape(r) + "</th>";
      cols.forEach((c) => {
        const v = Number(valueFn(r, c)) || 0;
        const a = (v / max) * 0.55;
        html +=
          "<td class='heat-cell' style='background:rgba(" +
          color +
          "," +
          a.toFixed(2) +
          ")'>" +
          v +
          "</td>";
      });
      html += "</tr>";
    });
    return html + "</tbody></table>";
  };

  Kit.copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      if (window.VQ) VQ.toast("Copied");
      return true;
    } catch (_) {
      if (window.VQ) VQ.toast("Copy failed");
      return false;
    }
  };

  Kit.downloadText = (filename, text, mime) => {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  Kit.slug = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);

  Kit.relativeTime = (ts) => {
    const d = Date.now() - ts;
    if (d < 60000) return "just now";
    if (d < 3600000) return Math.floor(d / 60000) + "m ago";
    if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
    return Math.floor(d / 86400000) + "d ago";
  };

  Kit.mountKpiRow = (parent, items) => {
    if (!parent) return null;
    const row = document.createElement("div");
    row.className = "kpi-row";
    row.innerHTML = items
      .map(
        (it, i) =>
          `<div class="card"><div class="stat"><span>${Kit.escape(it.label)}</span><strong data-kpi="${i}">${Kit.escape(it.value)}</strong></div></div>`
      )
      .join("");
    parent.insertBefore(row, parent.firstChild);
    return {
      set(i, v) {
        const el = row.querySelector('[data-kpi="' + i + '"]');
        if (el) el.textContent = v;
      },
      el: row
    };
  };

  Kit.filterChips = (parent, options, onChange) => {
    if (!parent || parent.querySelector("[data-kit-chips]")) return;
    const wrap = document.createElement("div");
    wrap.className = "chips";
    wrap.setAttribute("data-kit-chips", "1");
    let active = options[0]?.value ?? "all";
    const paint = () => {
      wrap.innerHTML = options
        .map(
          (o) =>
            `<button type="button" class="chip-btn ${o.value === active ? "active" : ""}" data-v="${Kit.escape(o.value)}">${Kit.escape(o.label)}</button>`
        )
        .join("");
      wrap.querySelectorAll("[data-v]").forEach((b) => {
        b.onclick = () => {
          active = b.dataset.v;
          paint();
          onChange(active);
        };
      });
    };
    paint();
    parent.insertBefore(wrap, parent.firstChild);
    return {
      get: () => active,
      set: (v) => {
        active = v;
        paint();
      }
    };
  };

  Kit.scoreText = (text, rules) => {
    let score = 50;
    const notes = [];
    (rules || []).forEach((r) => {
      try {
        if (r.test(text)) {
          score += r.pts || 0;
          if (r.note) notes.push(r.note);
        }
      } catch (_) {}
    });
    return { score: Kit.clamp(score, 0, 100), notes };
  };

  Kit.mergeState = (key, patch) => {
    let cur = {};
    try {
      cur = JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch (_) {}
    const next = Object.assign({}, cur, patch);
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  };

  Kit.observeClicks = (ids, fn) => {
    (ids || []).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", () => setTimeout(fn, 0));
    });
  };

  Kit.ensureProSection = (id, title, html) => {
    if (document.getElementById(id)) return document.getElementById(id);
    const main = document.querySelector(".main");
    if (!main) return null;
    const el = document.createElement("section");
    el.id = id;
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = "<h2>" + Kit.escape(title) + "</h2>" + (html || "");
    main.appendChild(el);
    return el;
  };

  Kit.histogram = (values, buckets) => {
    const n = buckets || 5;
    if (!values.length) return Kit.barChart({});
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const map = {};
    for (let i = 0; i < n; i++) {
      const a = min + (span * i) / n;
      const b = min + (span * (i + 1)) / n;
      map[Math.round(a) + "–" + Math.round(b)] = 0;
    }
    const keys = Object.keys(map);
    values.forEach((v) => {
      let idx = Math.floor(((v - min) / span) * n);
      if (idx >= n) idx = n - 1;
      map[keys[idx]]++;
    });
    return Kit.barChart(map);
  };

  Kit.safeJSON = (str, fallback) => {
    try {
      return JSON.parse(str);
    } catch (_) {
      return fallback;
    }
  };

  Kit.uid = () =>
    (window.VQ && VQ.uid && VQ.uid()) || Math.random().toString(36).slice(2, 10);

  global.VQKit = Kit;
})(window);
