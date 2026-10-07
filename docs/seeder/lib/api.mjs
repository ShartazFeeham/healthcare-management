// Thin HTTP + DB helpers for the seeder. Talks only to localhost.
import { execFileSync } from "node:child_process";

export const SVC = {
  account: "http://localhost:5100", files: "http://localhost:5200", integration: "http://localhost:5300",
  i18n: "http://localhost:5400", patients: "http://localhost:7100", doctors: "http://localhost:7200",
  medicines: "http://localhost:7300", appointments: "http://localhost:7400", community: "http://localhost:7500",
  notifications: "http://localhost:7600", cdss: "http://localhost:7800",
};

// Long-lived internal service token (same one the microservices use to call each other).
export const INTERNAL = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJJTlRFUk5BTCIsInJvbGVzIjpbIlJPTEVfSU5URVJOQUwiXSwiZXhwIjoyMDE1MjE2Mzg0fQ.GpRoQRcjHJjk6DHaT-qpV0dkvJF_7GGsiaq6pTmc_Fk";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function call(method, url, { token, body, query, form, allow = [] } = {}) {
  const u = new URL(url);
  if (query) Object.entries(query).forEach(([k, v]) => u.searchParams.set(k, v));
  const headers = {};
  if (token) headers.Authorization = token.startsWith("Bearer ") ? token : "Bearer " + token;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(u, { method, headers, body: payload });
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch { /* plain text */ }
  if (!res.ok && !allow.includes(res.status)) {
    const msg = typeof data === "object" ? data.message || JSON.stringify(data) : data;
    const err = new Error(`${method} ${u.pathname} -> ${res.status}: ${String(msg).slice(0, 220)}`);
    err.status = res.status; err.data = data; throw err;
  }
  return { status: res.status, data };
}
export const get = (url, o) => call("GET", url, o);
export const post = (url, o) => call("POST", url, o);
export const put = (url, o) => call("PUT", url, o);
export const del = (url, o) => call("DELETE", url, o);

// ---- accounts ----------------------------------------------------------------------------
export async function latestOtp(email, since = 0) {
  for (let i = 0; i < 40; i++) {
    const { data } = await get(`${SVC.integration}/v1/outbox`, { query: { channel: "email" } });
    const hit = data.find((m) => m.to === email && /\d{6}/.test(m.body) && m.id > since);
    if (hit) return Number(hit.body.match(/\d{6}/)[0]);
    await sleep(250);
  }
  throw new Error("OTP email never arrived for " + email);
}
export async function outboxMark() {
  const { data } = await get(`${SVC.integration}/v1/outbox`);
  return data.reduce((m, e) => Math.max(m, e.id), 0);
}

// Login. A brand new account is locked until its OTP (delivered to the local mailbox) is entered.
export async function login(email, password) {
  const first = await post(`${SVC.account}/access/login`, { body: { identity: email, password }, allow: [403, 406] });
  if (first.status === 403) return { pendingActivation: true, message: first.data.message };
  if (first.status === 200) return first.data;
  const mark = await outboxMark();
  if (/locked|verify/i.test(first.data.message || "")) {
    await post(`${SVC.account}/access/generate-otp/${encodeURIComponent(email)}`);
  }
  const otp = await latestOtp(email, mark);
  const second = await post(`${SVC.account}/access/login`, { body: { identity: email, password, otp }, allow: [403, 406] });
  return second.status === 200 ? second.data : { pendingActivation: true, message: second.data.message };
}

// ---- database (only used for history the public API deliberately refuses to create) --------
export function sql(db, statement) {
  return execFileSync("docker", ["exec", "-i", "healthcare-mysql", "mysql", "-uhealthcare", "-phealthcare", "--default-character-set=utf8mb4", db],
    { input: statement, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}
export const q = (v) => (v === null || v === undefined ? "NULL" : "'" + String(v).replace(/\\/g, "\\\\").replace(/'/g, "''") + "'");

// ---- misc ----------------------------------------------------------------------------------
export function rng(seed = 7) {
  let s = seed >>> 0;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return {
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle: (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  };
}
export const log = (...a) => console.log(...a);
// Local calendar date (toISOString would shift it by the UTC offset around midnight).
export const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
