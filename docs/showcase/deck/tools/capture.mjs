#!/usr/bin/env node
// Captures every feature screen twice, once as a desktop viewport (1440x900, for the Mac monitor) and once as a
// phone viewport (390x844, for the phone frame). The app is responsive, so these are the same screens.
// usage: node tools/capture.mjs [desktop|mobile]
import { launch } from "../../tools/cdp.mjs";
import { readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://localhost:3100";
const seed = JSON.parse(readFileSync(join(ROOT, "../../seeder/last-run.json")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (m, u, t, b) => { const r = await fetch(u, { method: m, headers: { ...(b ? { "Content-Type": "application/json" } : {}), ...(t ? { Authorization: "Bearer " + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); const x = await r.text(); try { return JSON.parse(x); } catch { return x; } };
const login = (u) => api("POST", "http://localhost:5100/access/login", null, { identity: u.email, password: u.password });
const patient = await login(seed.patients[0]), doctor = await login(seed.doctors.find((d) => d.id === "DIC1")), admin = await login(seed.admins[0]);
const sql = (q) => execFileSync("docker", ["exec", "-i", "healthcare-mysql", "mysql", "-uhealthcare", "-phealthcare", "healthcare_appointments"], { input: q, stdio: ["pipe", "ignore", "ignore"] });
const session = (s) => ({ token: s.bearerToken, role: s.role, userId: s.userId, email: s.email, language: "English" });
const only = process.argv[2];

const bP = await launch({ port: 9440, width: 1440, height: 900 }), bD = await launch({ port: 9441, width: 1440, height: 900 }), bA = await launch({ port: 9442, width: 1440, height: 900 });
const pp = await bP.newPage(), dp = await bD.newPage(), ap = await bA.newPage();
await pp.setStorage(session(patient), BASE); await dp.setStorage(session(doctor), BASE); await ap.setStorage(session(admin), BASE);
const clickCard = (n) => `(() => { const c=[...document.querySelectorAll('.card.mt-2')].find(e=>e.innerText.includes(${JSON.stringify(n)})); c && c.click(); })()`;
const clickDate = (n) => `(() => { const b=[...document.querySelectorAll('li,a,div,span')].filter(e=>e.children.length===0 && /^\\d{4}-\\d{2}-\\d{2}$/.test((e.innerText||'').trim()))[${n}]; b && b.click(); })()`;
const scrollTo = (p, text, off = 20) => p.eval(`(() => { const all=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,div,span,p,b')].filter(e=>(e.innerText||'').trim().toLowerCase().startsWith(${JSON.stringify(text.toLowerCase())}) && e.children.length<4 && e.offsetParent); const e=all[0]; if(e){ const y=e.getBoundingClientRect().top+scrollY-${off}; scrollTo(0,y); } })()`);
const post = (await api("GET", "http://localhost:7500/posts/list/article/0/3/true", patient.bearerToken))[0];

// each scene: id, page, async run(p, mode)
const SCENES = [
  ["home", pp, async (p) => { await p.goto(BASE + "/common/index", { settle: 1800 }); }],
  ["pdash", pp, async (p) => { await p.goto(BASE + "/health/patient", { settle: 2000 }); }],
  ["ddash", dp, async (p) => { await p.goto(BASE + "/health/doctor", { settle: 2000 }); }],
  ["adash", ap, async (p) => { await p.goto(BASE + "/health/admin", { settle: 2000 }); }],
  ["book1", pp, async (p) => { await p.goto(BASE + "/health/appointment", { settle: 1800 }); }],
  ["book2", pp, async (p, m) => { await p.goto(BASE + "/health/appointment", { settle: 1500 }); await p.eval(clickCard("Imran Chowdhury")); await sleep(1500); await p.eval(clickDate(1)); await sleep(1500); await scrollTo(p, "Schedule details", m ? 30 : 120); await sleep(400); }],
  ["book3", pp, async (p) => { await p.goto(BASE + "/health/notifications", { settle: 1800 }); }],
  ["sched1", dp, async (p, m) => { await p.goto(BASE + "/health/doctor", { settle: 1800 }); await p.eval(clickDate(1)); await sleep(1500); await scrollTo(p, "Manage your schedules", 30); await sleep(400); }],
  ["sched2", dp, async (p) => { await p.goto(BASE + "/health/doctor", { settle: 1800 }); await scrollTo(p, "Delay management", 30); await sleep(400); }],
  ["sched3", dp, async (p) => { await p.goto(BASE + "/health/doctor", { settle: 1800 }); await scrollTo(p, "Upcoming Appointments", 20); await sleep(400); }],
  ["rep1", pp, async (p) => { await p.goto(BASE + "/health/patients/" + patient.userId, { settle: 2200 }); await scrollTo(p, "Treatment Info", 20); await sleep(400); }],
  ["rep2", pp, async (p) => { await p.goto(BASE + "/health/patients/" + patient.userId, { settle: 2200 }); await scrollTo(p, "Most similar anonymised", 20); await sleep(400); }],
  ["rep3", pp, async (p) => { await p.goto(BASE + "/health/patients/" + patient.userId, { settle: 2200 }); await scrollTo(p, "AI health analysis", 20); await sleep(400); }],
  ["com1", pp, async (p) => { await p.goto(BASE + "/health/community", { settle: 2000 }); }],
  ["com2", pp, async (p) => { await p.goto(BASE + "/health/posts/" + post.postId, { settle: 2000 }); }],
  ["com3", pp, async (p) => { await p.goto(BASE + "/health/community", { settle: 2000 }); await scrollTo(p, "Articles Written", 10); await sleep(400); }],
  ["sea1", pp, async (p) => { await p.goto(BASE + "/common/search?query=cardio", { settle: 2200 }); }],
  ["sea2", pp, async (p) => { await p.goto(BASE + "/common/medicines", { settle: 1800 }); }],
  ["sea3", pp, async (p) => { await p.goto(BASE + "/common/equipments", { settle: 1800 }); }],
  ...["English", "Bengali", "Hindi", "Arabic", "Spanish", "Japanese"].map((l) => ["lang-" + l.toLowerCase(), pp, async (p) => { await p.eval(`localStorage.setItem('language','${l}')`); await p.goto(BASE + "/public/login", { settle: 2000 }); }]),
  ["mail", pp, async (p) => { await fetch("http://localhost:5300/v1/outbox", { method: "DELETE" }); await fetch("http://localhost:5100/access/generate-otp/" + encodeURIComponent(seed.patients[1].email), { method: "POST" }); await sleep(800); await p.eval("localStorage.setItem('language','English')"); await p.goto(BASE + "/common/mailbox", { settle: 1800 }); }],
  ["adm2", ap, async (p) => { await p.goto(BASE + "/health/admin", { settle: 1500 }); await p.click("text=Manage doctors", { settle: 1200 }); }],
  ["adm3", ap, async (p) => { await p.goto(BASE + "/health/admin", { settle: 1500 }); await p.click("text=Room allocation", { settle: 1200 }); }],
  ["adm4", ap, async (p) => { await p.goto(BASE + "/health/admin", { settle: 1500 }); await p.click("text=Statistics", { settle: 2500 }); }],
];

async function runMode(mode) {
  const dir = join(ROOT, "assets", mode === "desktop" ? "d" : "m"); mkdirSync(dir, { recursive: true });
  const [w, h, sc] = mode === "desktop" ? [1440, 900, 1.25] : [390, 844, 2.5];
  for (const p of [pp, dp, ap]) await p.setViewport(w, h, sc);
  for (const [id, p, run] of (process.env.CALL_ONLY ? [] : SCENES.filter((s) => !process.env.IDS || process.env.IDS.split(",").includes(s[0])))) {
    try { await run(p, mode === "mobile"); await sleep(500); await p.screenshot(join(dir, id + ".jpg")); console.log("✓", mode, id); } catch (e) { console.log("✗", mode, id, e.message.split("\n")[0]); }
  }
  if (process.env.IDS) return;
  // video call: waiting (one participant) and connected (two), needs both tabs in the same profile
  const id = `${doctor.userId}-${patient.userId}-99`, now = new Date(), ts = now.toISOString().slice(0, 19).replace("T", " ");
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  sql(`DELETE FROM appointment WHERE id='${id}'; INSERT INTO appointment (id,doctor_id,patient_id,date,shift,type,serial_no,appointment_time,scheduling_time,cancelled) VALUES ('${id}','${doctor.userId}','${patient.userId}','${day}','morning','Telemedicine',99,'${ts}','${ts}',0);`);
  await pp.setStorage(session(patient), BASE); await pp.setViewport(w, h, sc);
  await pp.goto(BASE + "/tele/call/" + id, { settle: 2800 }); await sleep(800); await pp.screenshot(join(dir, "call1.jpg")); console.log("✓", mode, "call1");
  const dtab = await bP.newPage({ width: w, height: h, scale: sc }); await dtab.setStorage(session(doctor), BASE); await dtab.goto(BASE + "/tele/call/" + id, { settle: 2800 }); await sleep(7500);
  await pp.screenshot(join(dir, "call2.jpg")); console.log("✓", mode, "call2"); await dtab.close(); await pp.setStorage(session(patient), BASE);
  sql(`DELETE FROM appointment WHERE id='${id}';`);
}
for (const m of ["desktop", "mobile"]) if (!only || only === m) await runMode(m);
await bP.close(); await bD.close(); await bA.close();
