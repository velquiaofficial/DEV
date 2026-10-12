const ACCOUNTS = "tabi-hisho-accounts-v1";
const SESSION = "tabi-hisho-session-v1";

export async function hashPass(password) {
  const data = new TextEncoder().encode(`tabi-hisho:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(list) {
  localStorage.setItem(ACCOUNTS, JSON.stringify(list));
}

export function currentAccount() {
  const id = localStorage.getItem(SESSION);
  if (!id) return null;
  return readAccounts().find((account) => account.id === id) || null;
}

function claimLegacy(userId) {
  for (const key of ["tabi-hisho-plans-v1", "tabi-hisho-been-v1", "tabi-hisho-desk-v1"]) {
    const scoped = `${key}:${userId}`;
    if (localStorage.getItem(scoped) != null) continue;
    const legacy = localStorage.getItem(key);
    if (legacy) localStorage.setItem(scoped, legacy);
  }
}

export async function registerAccount({ name, password, origin }) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("名前を書いてください。");
  if (password.length < 4) throw new Error("パスワードは4文字以上にしてください。");
  const list = readAccounts();
  if (list.some((account) => account.name === trimmed)) throw new Error("その名前はすでに使われています。");
  const account = {
    id: crypto.randomUUID(),
    name: trimmed,
    passHash: await hashPass(password),
    origin: origin || "東京",
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...list, account]);
  localStorage.setItem(SESSION, account.id);
  claimLegacy(account.id);
  return account;
}

export async function loginAccount(name, password) {
  const trimmed = name.trim();
  const account = readAccounts().find((item) => item.name === trimmed);
  const hash = await hashPass(password);
  if (!account || account.passHash !== hash) throw new Error("名前かパスワードが違います。");
  localStorage.setItem(SESSION, account.id);
  claimLegacy(account.id);
  return account;
}

export function logoutAccount() {
  localStorage.removeItem(SESSION);
}

export function updateAccount(id, patch) {
  const list = readAccounts().map((account) => (account.id === id ? { ...account, ...patch } : account));
  writeAccounts(list);
  return list.find((account) => account.id === id) || null;
}

export function loadScoped(key, userId, fallback) {
  try {
    const raw = localStorage.getItem(userId ? `${key}:${userId}` : key);
    const parsed = JSON.parse(raw || "null");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveScoped(key, userId, value) {
  if (!userId) return;
  localStorage.setItem(`${key}:${userId}`, JSON.stringify(value));
}
