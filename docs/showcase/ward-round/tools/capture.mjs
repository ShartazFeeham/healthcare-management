#!/usr/bin/env node
// Captures everything the Ward Round page needs from the running app:
//  - one screenshot per examination scene, with the on-screen position of each callout (as % of the image)
//  - frame sequences (booking, delay, report, languages)
// Output: assets/img/*.jpg, assets/seq/<name>/NN.jpg, data/captures.json
import { launch } from "../../tools/cdp.mjs";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
const BASE = "http://localhost:3100";
const seed = JSON.parse(readFileSync(join(ROOT, "../../seeder/last-run.json")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (method, url, token, body) => { const r = await fetch(url, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
const login = (u) => api("POST", "http://localhost:5100/access/login", null, { identity: u.email, password: u.password });
const doctor = await login(seed.doctors.find((d) => d.id === "DIC1")), patient = await login(seed.patients[0]);
const sql = (q) => execFileSync("docker", ["exec", "-i", "healthcare-mysql", "mysql", "-uhealthcare", "-phealthcare", "healthcare_appointments"], { input: q, stdio: ["pipe", "ignore", "ignore"] });

// Two separate Chrome profiles so the patient and the doctor can be signed in at the same time.
const browser = await launch({ port: 9420, width: 1440, height: 900, scale: 1.1 });
const browserD = await launch({ port: 9421, width: 1440, height: 900, scale: 1.1 });
const session = (s) => ({ token: s.bearerToken, role: s.role, userId: s.userId, email: s.email, language: "English" });
const mk = async (b, s) => { const p = await b.newPage(); await p.setStorage(session(s), BASE); return p; };
const pp = await mk(browser, patient), dp = await mk(browserD, doctor);
const clickCard = (name) => `(() => { const c=[...document.querySelectorAll('.card.mt-2')].find(e=>e.innerText.includes(${JSON.stringify(name)})); c && c.click(); })()`;
mkdirSync(join(ROOT, "assets/img"), { recursive: true });
const captures = { images: {}, sequences: {} };

// where an element sits inside the screenshot, as percentages (so rings scale with the image)
async function rect(p, spec, clipBox) {
  const r = await p.eval(`(() => { const spec=${JSON.stringify(spec)};
    let e = spec.sel ? document.querySelector(spec.sel) : null;
    if (!e && spec.text) { const all=[...document.querySelectorAll('button,a,div,span,h1,h2,h3,h4,h5,td,th,b,li,p')].filter(x=>(x.innerText||'').trim().startsWith(spec.text) && x.children.length<5 && x.offsetParent); all.sort((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height-b.getBoundingClientRect().width*b.getBoundingClientRect().height); e = all[0]; }
    if (!e) return null; const b=e.getBoundingClientRect(); return {x:b.x+scrollX,y:b.y+scrollY,w:b.width,h:b.height}; })()`);
  if (!r) return null;
  const W = clipBox ? clipBox.w : 1440, H = clipBox ? clipBox.h : 900, ox = clipBox ? clipBox.x : 0, oy = clipBox ? clipBox.y : 0;
  const pad = 6;
  return { x: +(((r.x - ox - pad) / W) * 100).toFixed(2), y: +(((r.y - oy - pad) / H) * 100).toFixed(2), w: +(((r.w + pad * 2) / W) * 100).toFixed(2), h: +(((r.h + pad * 2) / H) * 100).toFixed(2), label: spec.label };
}
async function snap(id, p, callouts = [], { clipSel, full = false, width = 1600 } = {}) {
  let clip, box;
  if (clipSel) { box = await p.eval(`(() => { const b=document.querySelector(${JSON.stringify(clipSel)}).getBoundingClientRect(); return {x:b.x+scrollX,y:b.y+scrollY,w:b.width,h:b.height}; })()`); clip = { x: box.x, y: box.y, width: box.w, height: box.h }; }
  const rects = (await Promise.all(callouts.map((c) => rect(p, c, box)))).filter(Boolean);
  const file = join(ROOT, "assets/img", id + ".jpg");
  await p.screenshot(file, { full, clip });
  captures.images[id] = { file: `assets/img/${id}.jpg`, callouts: rects };
  console.log("✓", id, rects.length + "/" + callouts.length + " callouts");
}
async function seq(name, frames) { // frames: [async (p)=>..., ...]; smaller JPEGs
  const dir = join(ROOT, "assets/seq", name); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const out = [];
  for (let i = 0; i < frames.length; i++) { const { p, run, caption } = frames[i]; await run(p); await sleep(450); const f = join(dir, String(i + 1).padStart(2, "0") + ".jpg"); await p.screenshot(f); out.push({ file: `assets/seq/${name}/${String(i + 1).padStart(2, "0")}.jpg`, caption }); }
  captures.sequences[name] = out; console.log("✓ sequence", name, out.length, "frames");
}
const clickDate = (n) => `(() => { const b=[...document.querySelectorAll('li,a,div,span')].filter(e=>e.children.length===0 && /^\\d{4}-\\d{2}-\\d{2}$/.test((e.innerText||'').trim()))[${n}]; b && b.click(); })()`;
const waitTxt = (p, t) => p.waitFor(`document.body.innerText.includes(${JSON.stringify(t)})`, 8000).catch(() => {});

// ------------------------------------------------------------------ scene 1: booking
await pp.goto(BASE + "/health/appointment", { settle: 1500 });
await pp.eval(clickCard("Imran Chowdhury")); await sleep(1500); await pp.eval(clickDate(1)); await sleep(1500);
await snap("ex-book", pp, [{ text: "Capacity:", label: "Capacity per slot, set by the doctor" }, { text: "Booked:", label: "Live booked count" }, { text: "Apply", label: "Server refuses a full slot" }]);

// ------------------------------------------------------------------ scene 2: the doctor runs late
await api("POST", "http://localhost:7400/delays/update/15", doctor.bearerToken);
await sleep(1500);
await dp.goto(BASE + "/health/doctor", { settle: 1800 });
await dp.eval("window.scrollTo(0, document.body.scrollHeight)"); await sleep(600);
await snap("ex-delay-doctor", dp, [{ text: "Your current delay", label: "Doctor announces a 15 minute delay" }]);
await pp.goto(BASE + "/health/appointment", { settle: 1500 }); await pp.eval(clickCard("Imran Chowdhury")); await sleep(1500); await pp.eval(clickDate(1)); await sleep(1500);
await snap("ex-delay-slot", pp, [{ text: "Delay:", label: "Delay shown on the slot" }]);
await api("POST", "http://localhost:7400/delays/update/0", doctor.bearerToken); // leave the system as it was

// ------------------------------------------------------------------ scene 3: OTP offline
await fetch("http://localhost:5300/v1/outbox", { method: "DELETE" });
await fetch("http://localhost:5100/access/generate-otp/" + encodeURIComponent(seed.patients[1].email), { method: "POST" }); await sleep(800);
await pp.goto(BASE + "/common/mailbox", { settle: 1800 });
await snap("ex-otp", pp, [{ sel: ".badge-success", label: "The one-time code, delivered offline" }, { text: "Local mailbox", label: "No email or SMS provider" }]);

// ------------------------------------------------------------------ scene 4: video visit
const id = `${doctor.userId}-${patient.userId}-99`, now = new Date(), ts = now.toISOString().slice(0, 19).replace("T", " ");
const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
sql(`DELETE FROM appointment WHERE id='${id}'; INSERT INTO appointment (id,doctor_id,patient_id,date,shift,type,serial_no,appointment_time,scheduling_time,cancelled) VALUES ('${id}','${doctor.userId}','${patient.userId}','${day}','morning','Telemedicine',99,'${ts}','${ts}',0);`);
await pp.setStorage(session(patient), BASE); await pp.goto(BASE + "/tele/call/" + id, { settle: 2500 });
const dtab = await browser.newPage(); await dtab.setStorage(session(doctor), BASE); await dtab.goto(BASE + "/tele/call/" + id, { settle: 2500 }); await sleep(4000);
await snap("ex-video", pp, [{ text: "CONNECTED", label: "Server-verified, peer-to-peer" }]);
await snap("ex-video-doctor", dtab, [{ text: "Telemedicine consultation", label: "Doctor's side of the same call" }]);
await dtab.close(); await pp.setStorage(session(patient), BASE);
sql(`DELETE FROM appointment WHERE id='${id}';`);

// ------------------------------------------------------------------ scene 5: the report
await pp.goto(BASE + "/health/patients/" + patient.userId, { settle: 2200 });
await pp.eval("[...document.querySelectorAll('button')].find(b=>/Generate/.test(b.innerText))?.click()"); await sleep(2800);
await snap("ex-report", pp, [{ text: "Overview of", label: "1 · what the record says" }, { text: "Insights from", label: "2 · comparable anonymised cases" }, { text: "Feedback and outlook", label: "3 · what to do next" }], { clipSel: "#ai-analysis" });

// ------------------------------------------------------------------ scene 6: treatment and goal
await dp.goto(BASE + "/health/write-treatment", { settle: 1800 });
await dp.type("#patientId", patient.userId); await dp.type("#condition", "Gastritis with acid reflux"); await dp.type("#medicines", "Pantoprazole 40 mg"); await dp.type("#diagnoses", "H. pylori breath test"); await dp.type("#progression", "Heartburn reduced after two weeks"); await dp.type("#doctorComment", "Avoid late dinners and spicy food");
await snap("ex-treat", dp, [{ sel: "#condition", label: "Structured record feeds the report" }, { sel: "#medicines", label: "Comma-separated, keyword-indexed" }]);
await pp.goto(BASE + "/health/patient", { settle: 1800 }); await pp.eval("window.scrollTo(0, 900)"); await sleep(600);
await snap("ex-goal", pp, [{ text: "List of all achievements", label: "Wellness challenges set by admins" }]);

// ------------------------------------------------------------------ sequences
await seq("booking", [
  { p: pp, caption: "Choose a doctor", run: async (p) => { await p.goto(BASE + "/health/appointment", { settle: 1500 }); } },
  { p: pp, caption: "Pick a day", run: async (p) => { await p.click(".card.mt-2", { settle: 1600 }); } },
  { p: pp, caption: "Pick a slot, with live capacity and delay", run: async (p) => { await p.eval(clickDate(2)); await sleep(1500); } },
]);
await seq("report", [
  { p: pp, caption: "Open the patient's profile", run: async (p) => { await p.goto(BASE + "/health/patients/" + patient.userId, { settle: 2000 }); await p.eval("document.getElementById('ai-analysis')?.scrollIntoView()"); } },
  { p: pp, caption: "Generate: similar cases are searched", run: async (p) => { await p.eval("[...document.querySelectorAll('button')].find(b=>/Generate/.test(b.innerText))?.click()"); await sleep(250); } },
  { p: pp, caption: "Three sections, written locally", run: async (p) => { await sleep(2500); await p.eval("document.getElementById('ai-analysis')?.scrollIntoView()"); } },
]);
const LANGS = ["English", "Bengali", "Hindi", "Arabic", "Spanish", "German", "Japanese", "Chinese", "Russian", "Portuguese"];
const lp = await browser.newPage(); await lp.setStorage({ language: "English" }, BASE);
await seq("languages", LANGS.map((l) => ({ p: lp, caption: l, run: async (p) => { await p.eval(`localStorage.setItem('language','${l}')`); await p.goto(BASE + "/public/login", { settle: 1800 }); } })));

writeFileSync(join(ROOT, "data-captures.json"), JSON.stringify(captures, null, 1));
await browser.close(); await browserD.close();
