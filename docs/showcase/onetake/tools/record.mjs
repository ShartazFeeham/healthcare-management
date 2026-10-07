#!/usr/bin/env node
// Records "One Take": drives the real app through the scripted afternoon as patient, doctor and admin, capturing
//  - frames (what is on screen after each action), - a cursor path and clicks, - the real HTTP requests it caused.
// Runs once for a desktop viewport and once for a phone viewport. Output: media/{d,p}/*.webp and film.js.
// usage: node tools/record.mjs [desktop|phone]
import { launch } from "../../tools/cdp.mjs";
import { CHAPTERS, END } from "./story.mjs";
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."), BASE = "http://localhost:3100", TMP = "/tmp/onetake";
const seed = JSON.parse(readFileSync(join(ROOT, "../../seeder/last-run.json")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (m, u, t, b) => { const r = await fetch(u, { method: m, headers: { ...(b ? { "Content-Type": "application/json" } : {}), ...(t ? { Authorization: "Bearer " + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); const x = await r.text(); try { return JSON.parse(x); } catch { return x; } };
const login = (u) => api("POST", "http://localhost:5100/access/login", null, { identity: u.email, password: u.password });
const patient = await login(seed.patients[0]), doctor = await login(seed.doctors.find((d) => d.id === "DIC1")), admin = await login(seed.admins[0]);
const session = (s) => ({ token: s.bearerToken, role: s.role, userId: s.userId, email: s.email, language: "English" });
const sql = (q) => execFileSync("docker", ["exec", "-i", "healthcare-mysql", "mysql", "-uhealthcare", "-phealthcare", "healthcare_appointments"], { input: q, stdio: ["pipe", "ignore", "ignore"] });
const SVC = { 5100: "account", 5200: "file-storage", 5300: "integration", 5400: "i18n", 7100: "patients", 7200: "doctors", 7300: "medicines", 7400: "appointment", 7500: "community", 7600: "notification", 7700: "help-desk", 7800: "cdss" };
const tpl = (p) => p.split("?")[0].replace(/\/[A-Z]{2,4}\d+(-[A-Za-z0-9]+)*(?=\/|$)/g, "/{id}").replace(/\/\d+(?=\/|$)/g, "/{n}").replace(/\/[^/]+@[^/]+/g, "/{email}").replace(/\/\d{4}-\d{2}-\d{2}/g, "/{date}");
const ts = (d) => d.toISOString().slice(0, 19).replace("T", " "), ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const vars = { patient0: seed.patients[0].email, patient1: seed.patients[1].email, patientPw: seed.patients[0].password, patientId: patient.userId, callEarly: `${doctor.userId}-${patient.userId}-98`, callNow: `${doctor.userId}-${patient.userId}-99` };
const fill = (s) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "{" + k + "}");
const only = process.argv[2];

async function recordMode(mode) {
  const [W, H, SC] = mode === "desktop" ? [1440, 900, 1] : [390, 844, 2];
  const out = join(TMP, mode); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const bP = await launch({ port: 9460, width: W, height: H, scale: SC }), bD = await launch({ port: 9461, width: W, height: H, scale: SC }), bA = await launch({ port: 9462, width: W, height: H, scale: SC });
  const pages = { patient: await bP.newPage(), doctor: await bD.newPage(), admin: await bA.newPage() };
  await pages.patient.setStorage({ language: "English" }, BASE); await pages.patient.eval("localStorage.clear()"); await pages.patient.setStorage({ language: "English" }, BASE);
  await pages.doctor.setStorage(session(doctor), BASE); await pages.admin.setStorage(session(admin), BASE);
  // request log per page (only the app's own API calls, never headers or tokens)
  const logs = new Map();
  for (const [name, p] of Object.entries(pages)) { const open = new Map(), list = []; logs.set(name, list); p.on((m) => {
    if (m.method === "Network.requestWillBeSent" && ["XHR", "Fetch"].includes(m.params.type) && m.params.request.method !== "OPTIONS") { const u = new URL(m.params.request.url); if (SVC[u.port]) open.set(m.params.requestId, { method: m.params.request.method, path: tpl(u.pathname), svc: SVC[u.port], t0: m.params.timestamp, status: null }); }
    if (m.method === "Network.responseReceived" && open.has(m.params.requestId)) open.get(m.params.requestId).status = m.params.response.status;
    if (m.method === "Network.loadingFinished" && open.has(m.params.requestId)) { const r = open.get(m.params.requestId); r.ms = Math.max(1, Math.round((m.params.timestamp - r.t0) * 1000)); list.push(r); open.delete(m.params.requestId); } }); }

  const film = []; let cursor = { x: 0.5, y: 0.5 }, clock = 0, frameNo = 0;
  const locate = async (page, expr) => page.eval(`(() => { const e = (${expr}); if (!e) return null; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  const moveCursor = (to, t0, ms, samples) => { const a = { ...cursor }, steps = Math.max(2, Math.round(ms / 60)); for (let i = 1; i <= steps; i++) { const k = i / steps, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, arc = Math.sin(Math.PI * k) * 0.035; samples.push([Math.round(t0 + k * ms), +(a.x + (to.x - a.x) * e).toFixed(4), +(a.y + (to.y - a.y) * e - arc).toFixed(4)]); } cursor = { ...to }; };

  for (const ch of CHAPTERS) {
    if (ch.id === "call") { const now = new Date(), early = new Date(now.getTime() + 40 * 60000); const mk = (id, t, serial) => `INSERT INTO appointment (id,doctor_id,patient_id,date,shift,type,serial_no,appointment_time,scheduling_time,cancelled) VALUES ('${id}','${doctor.userId}','${patient.userId}','${ymd(t)}','morning','Telemedicine',${serial},'${ts(t)}','${ts(now)}',0);`; sql(`DELETE FROM appointment WHERE id IN ('${vars.callEarly}','${vars.callNow}'); ${mk(vars.callEarly, early, 98)} ${mk(vars.callNow, now, 99)}`); }
    const page = pages[ch.profile || "patient"]; const logList = logs.get(ch.profile || "patient");
    if (ch.profile === undefined) await pages.patient.setStorage(pages.patient === page && ch.id !== "signin" ? session(patient) : {}, BASE).catch(() => {});
    const data = { frames: [], cursor: [[clock, +cursor.x.toFixed(4), +cursor.y.toFixed(4)]], clicks: [], req: [] };
    let local = 0, dtab = null;
    for (const st of ch.steps) {
      const t0 = clock + local, mark = logList.length; let lead = 0, frames = st.frames || 1;
      const shoot = async (k) => { const name = `${ch.id}-${String(++frameNo).padStart(3, "0")}.png`; await page.screenshot(join(out, name)); return name; };
      const settle = async () => { await page.idle(500).catch(() => {}); await sleep(450); };
      const click = async (pt, hold) => { const to = { x: pt.x / W, y: pt.y / H }, mv = Math.min(1100, Math.round(st.dur * 0.42)); moveCursor(to, t0, mv, data.cursor); lead = mv + 140; data.clicks.push([t0 + lead - 60, +to.x.toFixed(4), +to.y.toFixed(4)]);
        await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pt.x, y: pt.y }); await page.send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", clickCount: 1 }); await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", clickCount: 1 }); };
      const names = [];
      if (st.t === "goto") { await page.goto(BASE + fill(st.url), { settle: 1400 }); await settle(); for (let k = 0; k < frames; k++) { names.push(await shoot()); if (k < frames - 1) await sleep(1100); } }
      else if (st.t === "lang") { await page.eval(`localStorage.setItem('language', ${JSON.stringify(st.value)})`); await page.goto(BASE + "/public/login", { settle: 1800 }); await settle(); names.push(await shoot()); }
      else if (st.t === "click") { const pt = await locate(page, st.find); if (!pt) throw new Error("not found: " + st.find.slice(0, 80)); await click(pt); await settle(); for (let k = 0; k < frames; k++) { names.push(await shoot()); if (k < frames - 1) await sleep(1300); } }
      else if (st.t === "type") { const pt = await locate(page, `document.querySelector(${JSON.stringify(st.sel)})`); if (!pt) throw new Error("no field " + st.sel); await click(pt); await page.eval(`document.querySelector(${JSON.stringify(st.sel)}).select && document.querySelector(${JSON.stringify(st.sel)}).select()`); await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 }); await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
        const text = fill(st.text), n = st.chunks || 1; frames = n; let done = 0; for (let k = 1; k <= n; k++) { const upto = Math.ceil((text.length * k) / n); await page.send("Input.insertText", { text: text.slice(done, upto) }); done = upto; await sleep(250); names.push(await shoot()); } }
      else if (st.t === "scroll") { await page.eval(`(() => { const e = (${st.find}); if (e) { const y = e.getBoundingClientRect().top + scrollY - 24; scrollTo(0, y); } })()`); await sleep(500); for (let k = 0; k < frames; k++) { names.push(await shoot()); if (k < frames - 1) await sleep(900); } }
      else if (st.t === "key") { const codes = { Enter: 13 }; await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: st.key, code: st.key, windowsVirtualKeyCode: codes[st.key], text: "\r" }); await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: st.key, code: st.key, windowsVirtualKeyCode: codes[st.key] }); lead = 300; await sleep(900); await settle(); for (let k = 0; k < frames; k++) { names.push(await shoot()); if (k < frames - 1) await sleep(900); } }
      else if (st.t === "wait") { if (st.pre === "doctorJoins") { dtab = await bP.newPage({ width: W, height: H, scale: SC }); await dtab.setStorage(session(doctor), BASE); await dtab.goto(BASE + "/tele/call/" + vars.callNow, { settle: 2600 }); await sleep(2500); }
        for (let k = 0; k < frames; k++) { await sleep(1700); names.push(await shoot()); } }
      // schedule this step's frames inside its film-time window
      const avail = st.dur - lead; names.forEach((nm, k) => data.frames.push([Math.round(t0 + lead + (k * avail) / names.length), nm, `${ch.title}: ${st.alt}`]));
      const reqs = logList.slice(mark); reqs.slice(0, 5).forEach((r, i) => data.req.push([Math.round(t0 + Math.max(lead, 200) + i * 180), r.method, r.path, r.status ?? 0, r.ms ?? 0, r.svc]));
      data.cursor.push([t0 + st.dur, +cursor.x.toFixed(4), +cursor.y.toFixed(4)]); local += st.dur; console.log("  ✓", mode, ch.id, st.t, names.length + "f");
    }
    if (dtab) { await dtab.close(); await pages.patient.setStorage(session(patient), BASE); }
    const dur = local; film.push({ id: ch.id, n: ch.n, role: ch.role, title: ch.title, start: clock, end: clock + dur, cues: ch.cues.map(([a, b, tx]) => [clock + a, clock + Math.min(b, dur), tx]), drawer: ch.drawer || null, data }); clock += dur;
  }
  await bP.close(); await bD.close(); await bA.close();
  return { film, end: { start: clock, dur: END.dur } };
}
const result = {};
for (const m of ["desktop", "phone"]) if (!only || only === m) result[m] = await recordMode(m);
writeFileSync(join(TMP, "raw.json"), JSON.stringify({ ...(existsRaw()), ...result }));
function existsRaw() { try { return JSON.parse(readFileSync(join(TMP, "raw.json"), "utf8")); } catch { return {}; } }
sql(`DELETE FROM appointment WHERE id IN ('${vars.callEarly}','${vars.callNow}');`); await api("POST", "http://localhost:7400/delays/update/0", doctor.bearerToken);
console.log("recorded", Object.keys(result).join(", "));
