export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function overlap(a = [], b = []) {
  const set = new Set(b || []);
  return (a || []).filter((x) => set.has(x));
}

export function fill(template, ctx = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) =>
    ctx[key] == null ? "" : String(ctx[key]),
  );
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function pickDifferent(list, salt, last) {
  if (!list || !list.length) return "";
  const items = Array.isArray(list) ? list : [list];
  let hash = 0;
  const source = String(salt);
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 33 + source.charCodeAt(i)) >>> 0;
  }
  let index = hash % items.length;
  if (items.length > 1 && items[index] === last) index = (index + 1) % items.length;
  return items[index];
}

export function makeEcho(message) {
  const text = String(message || "").replace(/\s+/g, " ").trim();
  if (!text) return "その話";
  return text.length > 22 ? `${text.slice(0, 22)}…` : text;
}
