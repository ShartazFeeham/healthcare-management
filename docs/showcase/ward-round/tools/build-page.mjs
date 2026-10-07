#!/usr/bin/env node
// Renders index.html with every section's content as plain HTML (works with JavaScript off).
// js/round.js then enhances it: ECG scrubbing, boot animation, pinned scenes, exhibits, play mode.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const w = {}; globalThis.window = w; new Function("window", readFileSync(join(ROOT, "js/data.js"), "utf8"))(w);
const R = w.ROUND, C = R.captures;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const k = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));

// ---------------------------------------------------------------- ECG (static, pre-rendered)
const ecg = (() => {
  const W = 1000, H = 190, base = 130, max = Math.max(...R.daily.map((d) => d.n)), step = W / (R.daily.length + 1);
  let d = `M0 ${base}`;
  R.daily.forEach((p, i) => { const x = (i + 1) * step, h = (p.n / max) * 105; d += ` L${(x - step * 0.42).toFixed(1)} ${base} L${(x - step * 0.22).toFixed(1)} ${base - h * 0.18} L${(x - step * 0.1).toFixed(1)} ${base + 10} L${x.toFixed(1)} ${(base - h).toFixed(1)} L${(x + step * 0.12).toFixed(1)} ${base + 16} L${(x + step * 0.3).toFixed(1)} ${base}`; });
  d += ` L${W} ${base}`;
  return `<svg class="ecg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Appointments per day over ${R.daily.length} days, ${R.daily[0].date} to ${R.daily.at(-1).date}, peaking at ${max}"><path class="trace" id="ecg-path" d="${d}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/><line id="ecg-cross" class="cross" x1="0" y1="10" x2="0" y2="${H - 20}" opacity="0"/></svg>`;
})();

// ---------------------------------------------------------------- mixes
const sh = R.mix.shifts, shTotal = sh.morning + sh.afternoon + sh.evening;
const ty = R.mix.types, tyTotal = ty["In person"] + ty.Telemedicine, ring = (2 * Math.PI * 40);
const pct = (n, t) => ((n / t) * 100).toFixed(1);

// ---------------------------------------------------------------- scenes
const SCENES = [
  { id: "ex-book", time: "09:02", actor: "Eva Rahman", h: "Eva books a slot", cap: "Every slot has a capacity set by the doctor. Booked counts are live, and a full slot is refused by the server, not just greyed out in the screen.", hood: ["POST /appointments", "Appointment service :7400", "Serial and time are computed from slot capacity and skip times already passed; a full slot answers 406 \"The requested slot is already full\"."], alt: "Appointment screen for Dr. Imran Chowdhury showing capacity, booked count and an Apply button per shift" },
  { id: "ex-delay-slot", lane: "ex-delay-doctor", time: "09:05", actor: "Dr. Imran Chowdhury", h: "The doctor runs late", cap: "The doctor announces a delay. It applies to the shift it was announced in, booked patients are notified, and every slot shows it.", hood: ["POST /delays/update/{minutes}", "Appointment service, doctor role only", "notifyUpcomingPatients() finds the shift's appointments and sends one notification each through the notification service."], alt: "Slot table with a delay column, and the doctor's delay panel in the corner" },
  { id: "ex-otp", time: "09:06", actor: "Eva Rahman", h: "The one-time code arrives, offline", cap: "There is no email or SMS provider. Messages go to a local outbox and are shown in a mailbox page, so sign-up works on a plane.", hood: ["POST /access/generate-otp/{identity}  →  POST /v1/email/send", "Account → Integration :5300", "Integration records the message; GET /v1/outbox lists it. The mailbox page highlights the six digits."], alt: "Local mailbox page with a highlighted six-digit code" },
  { id: "ex-video", lane: "ex-video-doctor", time: "09:30", actor: "Eva and Dr. Chowdhury", h: "A video visit", cap: "The server decides who may join and when. Video then flows peer to peer over WebRTC, with signalling through the browser's own BroadcastChannel.", hood: ["GET /tele/verify/{appointmentId}", "Appointment service :7400", "Joining is allowed from 5 minutes before to 20 minutes after the delay-adjusted start. No signalling server, no vendor."], alt: "Two participants connected in a video call, with a connected badge and a timer" },
  { id: "ex-report", time: "09:50", actor: "Eva Rahman", h: "The report", cap: "Two similar, anonymised cases are found by keyword overlap. A local analyst then writes three sections: what the record says, what comparable patients did, and what to do next.", hood: ["GET /cdss/report/generate/{patientId}  →  POST /v1/ai/chat", "CDSS :7800 → Integration :5300", "The prompt carries the patient's treatments and two copied, anonymised cases. No cloud model is called."], alt: "AI health analysis panel with three report sections and similar anonymised cases" },
  { id: "ex-treat", lane: "ex-goal", time: "10:15", actor: "Dr. Imran Chowdhury", h: "Treatment, and a goal", cap: "The doctor records a structured treatment. Those keywords are what the similarity search later matches on. The patient, meanwhile, works on a wellness challenge.", hood: ["POST /treatments   ·   PUT /progress/accept-challenge/{id}", "CDSS :7800 · Patients :7100", "generateKeywords() normalises condition, medicines and diagnoses; challenges are created by admins and scored daily."], alt: "Treatment form filled in for a patient, and the patient's wellness challenges" },
];
const callouts = (img) => (C.images[img]?.callouts || []).map((c, i) => `<span class="ring" style="left:${c.x}%;top:${c.y}%;width:${c.w}%;height:${c.h}%" data-i="${i + 1}"><b>${i + 1}</b></span>`).join("");
const calloutList = (img) => (C.images[img]?.callouts || []).map((c, i) => `<li><b>${i + 1}</b> ${esc(c.label)}</li>`).join("");
const SEQ = { "ex-book": "booking", "ex-report": "report" };
const strip = (name) => { const f = C.sequences[name]; return f ? `<ol class="strip" aria-label="Frames: ${name}">${f.map((x, i) => `<li><img src="${x.file}" alt="${esc(x.caption)}" loading="lazy"><span>${i + 1} · ${esc(x.caption)}</span></li>`).join("")}</ol>` : ""; };
const langs = C.sequences.languages;
const langHtml = `<figure class="langs" id="langs"><div class="lang-stage">${langs.map((x, i) => `<img src="${x.file}" alt="Login screen in ${esc(x.caption)}" loading="lazy" ${i ? "" : 'class="on"'}>`).join("")}</div><ul class="lang-list" aria-label="Languages">${langs.map((x, i) => `<li><button type="button" data-i="${i}" ${i ? "" : 'aria-pressed="true"'}>${esc(x.caption)}</button></li>`).join("")}</ul><figcaption>The same screen in ten languages, served from the offline dictionary (${R.counts.translations} stored translations).</figcaption></figure>`;
const sceneHtml = SCENES.map((s, i) => `
  <article class="scene" id="scene-${i}" data-scene="${i}" tabindex="-1">
    <div class="scene-copy">
      <div class="stamp">${s.time}</div>
      <h3>${esc(s.h)}</h3>
      <p class="actor">${esc(s.actor)}</p>
      <p>${esc(s.cap)}</p>
      <ul class="legend">${calloutList(s.id)}</ul>
      ${SEQ[s.id] ? strip(SEQ[s.id]) : ""}
      <details class="hood"><summary>Under the hood</summary><code class="req">${esc(s.hood[0])}</code><p class="svc">${esc(s.hood[1])}</p><p>${esc(s.hood[2])}</p></details>
    </div>
    <figure class="shot">
      <div class="frame"><img src="${C.images[s.id].file}" alt="${esc(s.alt)}" loading="${i < 2 ? "eager" : "lazy"}">${callouts(s.id)}</div>
      ${s.lane ? `<div class="lane"><img src="${C.images[s.lane].file}" alt="Second view of the same scene" loading="lazy">${callouts(s.lane)}</div>` : ""}
    </figure>
  </article>`).join("");

// ---------------------------------------------------------------- problems
const PROBLEMS = [
  { id: "P1", sev: "critical", h: "Authorization rules matched no routes", sym: "Any signed-in patient could deactivate or suspend any account, and the internal e-mail lookup answered anonymous callers.", cause: "Route patterns did not match the real paths (two path segments vs three), so requests fell through to “authenticated”. A broad permitAll listed before the internal-only rule also swallowed it.", fix: "Patterns corrected, the specific rule moved ahead of the broad one. Verified: a patient now gets 403, an admin 200, anonymous getEmail 403.", badge: "Verified against the running service", kind: "grid" },
  { id: "P2", sev: "high", h: "Doctor passwords stored in plaintext", sym: "The doctor service kept the registration password in its own table, beside the properly hashed copy in the account service.", cause: "The entity had a password column that was copied from the registration form and never needed again.", fix: "Field removed; the only copy is the BCrypt hash owned by the account service.", badge: "Reconstructed from the fix", kind: "row" },
  { id: "P3", sev: "high", h: "The AI report crashed on every call", sym: "“Internal call to AI analysis failed” for every patient with a treatment record.", cause: "To anonymise similar cases, the code changed ids on managed JPA entities. When the request ended, Hibernate tried to write those changes back: “identifier of an instance of Treatment was altered from -1 to 4”.", fix: "Anonymise a detached copy. The managed entity is never touched.", badge: "Captured from a real run", kind: "trace" },
  { id: "P4", sev: "high", h: "The telemedicine join window was inverted", sym: "The refusal message said “within 5 minutes before”, the code let people in 20 minutes before and refused them 5 minutes after.", cause: "The comparison was written backwards relative to its own comment and message.", fix: "Window is now 5 minutes before to 20 minutes after the delay-adjusted start.", badge: "Reconstructed from the fix", kind: "clock" },
  { id: "P5", sev: "high", h: "A render loop became a request storm", sym: "The login screen hammered the i18n service until the browser ran out of resources.", cause: "The translation hook asked for a missing string on every render, and every answer triggered another render.", fix: "One shared cache; each (string, language) pair is requested at most once, and English never asks.", badge: "Illustrative rates", kind: "storm" },
  { id: "P6", sev: "medium", h: "Screens that looked finished but were not", sym: "A doctor's reviews, availability and personal info were hard-coded samples; reactions only logged to the console; the Verify button did nothing; the AI report had no screen.", cause: "Placeholder data and handlers were left behind after the backend was built.", fix: "Each one wired to its service, then checked by the end-to-end suite.", badge: "Verified by the suite", kind: "checklist" },
  { id: "P7", sev: "medium", h: "Delay notifications chose the wrong shift", sym: "Delays announced in the morning notified nobody; delays announced in the afternoon notified the morning's patients.", cause: "The morning test compared “after start and after end” instead of “before end”, and the delay lookup used “before start and after end”, which can never be true.", fix: "Both comparisons corrected, so a delay applies to the shift it was announced in.", badge: "Reconstructed from the fix", kind: "shift" },
];
const diffHtml = (id) => `<pre class="diff" aria-label="Changed lines in ${esc(R.diffs[id].file)}"><code>${R.diffs[id].lines.map((l) => `<span class="${l[0] === "+" ? "add" : l[0] === "-" ? "del" : "ctx"}">${esc(l)}</span>`).join("\n")}</code></pre><p class="file">${esc(R.diffs[id].file)}</p>`;
const problemHtml = PROBLEMS.map((p, i) => `
  <details class="problem" id="problem-${p.id}" data-kind="${p.kind}" ${i === 0 ? "open" : ""}>
    <summary><span class="pid">${p.id}</span><span class="ptitle">${esc(p.h)}</span><span class="sev ${p.sev}">${p.sev}</span><span class="status">Resolved</span></summary>
    <div class="plaque">
      <dl><dt>Symptom</dt><dd>${esc(p.sym)}</dd><dt>Root cause</dt><dd>${esc(p.cause)}</dd><dt>Fix and guard</dt><dd>${esc(p.fix)}</dd></dl>
      <div class="exhibit" data-exhibit="${p.kind}"><p class="badge-note">${esc(p.badge)}</p></div>
      ${diffHtml(p.id)}
    </div>
  </details>`).join("");

// ---------------------------------------------------------------- decisions
const DECISIONS = [
  ["Local rule-based analyst", "A cloud language model", "Patient data stays on the server, results are deterministic, it costs nothing and works offline.", "It cannot reason beyond its knowledge base and templates."],
  ["BroadcastChannel signalling", "A signalling server", "No extra service to run or secure for a demo-grade call.", "Both participants must use the same browser profile; a real deployment needs a signalling service."],
  ["Pre-translated dictionary", "Translating the interface live", "Ten languages that never fail on a network call.", "New strings are English until translated or the translator is reachable."],
  ["Local mailbox and outbox", "Email, SMS and push providers", "One-time codes are visible and testable offline.", "Nothing is actually delivered to a real phone or inbox."],
];
const decisionHtml = DECISIONS.map(([a, b, c, d]) => `<article class="decision"><p><span>Chose</span> ${esc(a)}</p><p><span>Rejected</span> ${esc(b)}</p><p><span>Because</span> ${esc(c)}</p><p class="tradeoff"><span>Trade-off accepted</span> ${esc(d)}</p></article>`).join("");

// ---------------------------------------------------------------- discharge
const checks = R.e2e.checks.map((c) => `<li class="${c.ok ? "ok" : "bad"}"><span class="tick" aria-hidden="true">${c.ok ? "✓" : "✗"}</span><span>${esc(c.name)}</span><span class="ms">${(c.ms / 1000).toFixed(1)}s</span><span class="sr">${c.ok ? "passed" : "failed"}</span></li>`).join("");
const pills = R.services.map((s) => `<li class="pill" data-order="${s.order}" tabindex="0" data-name="${esc(s.name)}" data-port="${s.port}" data-endpoints="${s.endpoints}" data-role="${esc(s.role)}" data-schema="${esc(s.schema || "none")}" data-started="${s.startedIn ?? ""}"><i></i>${esc(s.name)}<small>:${s.port}</small></li>`).join("");
const bootLines = R.boot.filter((l) => /✓|\d\)|Ready|Done/.test(l)).slice(0, 26).map(esc).join("\n");
const seeded = R.stats.system.patients + R.stats.system.doctors + 2;

const html = `<!doctype html>
<html lang="en" class="nojs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ward Round · EA Healthcare case chart</title>
<meta name="description" content="A clinical-chart case study of a healthcare platform: 15 services, real data, real defects and the evidence behind each claim.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230E7C86'/%3E%3Cpath d='M3 17h7l3-8 5 15 3-9h8' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<link rel="stylesheet" href="css/round.css">
<script>document.documentElement.className="js";</script>
</head>
<body>
<a class="skip" href="#examination">Skip to the examination</a>
<header class="rail" id="rail">
  <a class="rail-brand" href="#triage"><span class="ecg-ico" aria-hidden="true">∿</span> Ward Round</a>
  <nav aria-label="Chart sections">
    <a href="#admission">Admission</a><a href="#vitals">Vitals</a><a href="#examination">Examination</a><a href="#problems">Problems</a><a href="#plan">Plan</a><a href="#discharge">Discharge</a>
  </nav>
  <button class="play" id="play" type="button" aria-pressed="false">Play the round <small>60s</small></button>
  <button class="theme" id="theme" type="button" aria-label="Toggle light and dark theme">◐</button>
  <div class="rail-progress" aria-hidden="true"><i id="rail-bar"></i></div>
</header>

<main>
<section id="triage" class="triage">
  <div class="chart-head" role="group" aria-label="Chart header">
    <div><span>Patient</span>EA Healthcare Management System</div>
    <div><span>Admitted</span>${R.stats.system.services} services</div>
    <div><span>Attending</span>Shartaz Yeasar Feeham</div>
    <div><span>Status</span><b class="status-stamp" id="stamp">Stable</b></div>
  </div>
  <h1>I built a hospital's software, then <em>examined it like a patient.</em></h1>
  <p class="lead">A 60-second ward round. Or scroll and read the whole chart: every number below is drawn from the running system.</p>
  <div class="cta"><button class="btn primary" id="play2" type="button">Play the round</button><a class="btn" href="#admission">Read the chart</a></div>
  <svg class="hero-ecg" viewBox="0 0 1000 80" aria-hidden="true"><path d="M0 40 H180 l12 -8 12 8 H300 l10 -4 8 4 H380 l14 6 10 -42 12 62 10 -26 H520 l12 -8 12 8 H640 l12 -3 10 3 H760 l14 6 10 -42 12 62 10 -26 H1000" fill="none" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/></svg>
</section>

<section id="admission" class="chapter" data-beat="admission">
  <header class="ch-head"><span class="ch-no">1</span><div><h2>Admission</h2><p class="muted">One command, no cloud.</p></div></header>
  <div class="admission">
    <div class="term" role="group" aria-label="Terminal output of runner.sh 5">
      <div class="term-bar"><i></i><i></i><i></i><span>docs/runner.sh</span><button class="copy" id="copy" type="button" data-cmd="./docs/runner.sh 5">Copy</button></div>
      <pre id="term" data-final="${esc(bootLines)}"><span class="prompt">$</span> ./docs/runner.sh 5
${bootLines}</pre>
    </div>
    <div class="map">
      <ul class="pills" id="pills" aria-label="Services in start order">${pills}</ul>
      <div class="pill-detail" id="pill-detail" aria-live="polite">Select a service.</div>
      <dl class="counters" id="counters">
        <div><dt>users</dt><dd data-n="${seeded}">${seeded}</dd></div><div><dt>appointments</dt><dd data-n="${R.stats.system.appointments}">${R.stats.system.appointments}</dd></div><div><dt>reviews</dt><dd data-n="${R.counts.reviews}">${R.counts.reviews}</dd></div><div><dt>treatments</dt><dd data-n="${R.counts.treatments}">${R.counts.treatments}</dd></div><div><dt>posts</dt><dd data-n="${R.counts.posts}">${R.counts.posts}</dd></div>
      </dl>
    </div>
  </div>
  <p class="caption">Docker MySQL, ${R.stats.system.services} Spring Boot services, the web app and realistic seed data: one command, offline.</p>
</section>

<section id="vitals" class="chapter" data-beat="vitals">
  <header class="ch-head"><span class="ch-no">2</span><div><h2>Vitals</h2><p class="muted">The pulse of the system, drawn from real appointments.</p></div></header>
  <div class="ecg-wrap" id="ecg-wrap" tabindex="0" aria-describedby="ecg-read">${ecg}<output id="ecg-read" class="ecg-read">Hover or press the arrow keys to read a day.</output></div>
  <div class="instruments">
    <figure class="inst"><figcaption>Shift mix</figcaption>
      <div class="seg" role="img" aria-label="Morning ${sh.morning}, afternoon ${sh.afternoon}, evening ${sh.evening}"><i style="width:${pct(sh.morning, shTotal)}%"></i><i style="width:${pct(sh.afternoon, shTotal)}%"></i><i style="width:${pct(sh.evening, shTotal)}%"></i></div>
      <p class="key"><span>Morning ${sh.morning}</span><span>Afternoon ${sh.afternoon}</span><span>Evening ${sh.evening}</span></p></figure>
    <figure class="inst"><figcaption>Consultation types</figcaption>
      <svg viewBox="0 0 100 100" class="donut" role="img" aria-label="In person ${ty["In person"]}, telemedicine ${ty.Telemedicine}"><circle cx="50" cy="50" r="40" fill="none" stroke-width="14" class="d1"/><circle cx="50" cy="50" r="40" fill="none" stroke-width="14" class="d2" stroke-dasharray="${((ty.Telemedicine / tyTotal) * ring).toFixed(1)} ${ring.toFixed(1)}" transform="rotate(-90 50 50)"/></svg>
      <p class="key"><span>In person ${ty["In person"]}</span><span>Telemedicine ${ty.Telemedicine}</span></p></figure>
    <dl class="build-vitals"><div><dt>services</dt><dd>${R.stats.system.services}</dd></div><div><dt>endpoints</dt><dd>${R.stats.code.endpoints}</dd></div><div><dt>lines</dt><dd>${k(R.stats.code.backendLines + R.stats.code.frontendLines)}</dd></div><div><dt>screens</dt><dd>${R.stats.quality.screens}</dd></div><div><dt>languages</dt><dd>${R.stats.system.languages}</dd></div></dl>
  </div>
  <p class="caption">Every line on this page is drawn from the seeded database, not a mock-up. Seed data is synthetic.</p>
</section>

<section id="examination" class="chapter exam" data-beat="examination">
  <header class="ch-head"><span class="ch-no">3</span><div><h2>Examination</h2><p class="muted">One patient and one doctor, followed through the product.</p></div></header>
  <div class="scenes" id="scenes">${sceneHtml}</div>
</section>

<section id="problems" class="chapter" data-beat="problems">
  <header class="ch-head"><span class="ch-no">4</span><div><h2>Problem list</h2><p class="muted">What the examination found. Each entry opens into the evidence.</p></div></header>
  <div class="problems" id="problem-list">${problemHtml}</div>
</section>

<section id="plan" class="chapter" data-beat="plan">
  <header class="ch-head"><span class="ch-no">5</span><div><h2>Treatment plan</h2><p class="muted">Decisions, not just features.</p></div></header>
  <div class="decisions">${decisionHtml}</div>
  ${langHtml}
</section>

<section id="discharge" class="chapter" data-beat="discharge">
  <header class="ch-head"><span class="ch-no">6</span><div><h2>Discharge</h2><p class="muted">Reproducible with one command.</p></div></header>
  <div class="discharge">
    <ul class="checks" id="checks" aria-label="End-to-end checks">${checks}</ul>
    <div class="verdict"><b class="status-stamp big" id="verdict">${R.e2e.passed}/${R.e2e.total}</b><p>Discharged. The end-to-end suite drives the real interface in headless Chrome and verifies the effects through the APIs.</p>
      <p class="links"><a class="btn" href="../site/index.html">Open the product tour</a> <button class="btn" id="open-shots" type="button">Open the screenshots</button></p></div>
  </div>
  <p class="caption small">Seeded data is synthetic. No real patients were harmed in the making of this chart.</p>
</section>
</main>

<footer class="foot"><span>chart no. EA-HMS · generated from the running system on ${esc(R.generatedAt.slice(0, 10))}</span><span><kbd>J</kbd>/<kbd>K</kbd> scenes · <kbd>1</kbd>–<kbd>6</kbd> sections · <kbd>Space</kbd> play · <kbd>?</kbd> help</span></footer>

<div class="captions" id="captions" aria-live="polite"></div>
<dialog id="lightbox" class="lightbox"><form method="dialog"><button class="close" aria-label="Close">×</button></form><img id="lb-img" alt=""><p id="lb-cap"></p><div class="lb-nav"><button id="lb-prev" type="button" aria-label="Previous">‹</button><button id="lb-next" type="button" aria-label="Next">›</button></div></dialog>
<dialog id="help" class="help"><form method="dialog"><button class="close" aria-label="Close">×</button></form><h3>Keyboard</h3><dl><dt>J / K or arrows</dt><dd>Next / previous scene</dd><dt>1 – 6</dt><dd>Jump to a section</dd><dt>Space</dt><dd>Play or pause the round</dd><dt>Enter</dt><dd>Open or close the focused exhibit</dd><dt>Esc</dt><dd>Close dialogs</dd></dl></dialog>
<noscript><style>.rail .play,.rail .theme,.copy{display:none}</style></noscript>
<script src="js/data.js"></script>
<script src="js/round.js"></script>
</body>
</html>
`;
writeFileSync(join(ROOT, "index.html"), html);
console.log("index.html", Math.round(html.length / 1024) + " KB");
