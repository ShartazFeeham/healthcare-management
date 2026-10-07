// Showcase behaviour: renders everything from data/shots.json + data/stats.json. No dependencies.
const $ = (s, el = document) => el.querySelector(s);
const el = (tag, attrs = {}, html = "") => Object.assign(document.createElement(tag), attrs, html ? { innerHTML: html } : {});
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } } };

const [shots, stats] = await Promise.all([fetch("data/shots.json").then((r) => r.json()), fetch("data/stats.json").then((r) => r.json())]);
const byId = Object.fromEntries(shots.map((s) => [s.id, s]));

// ---------------------------------------------------------------- theme
const root = document.documentElement;
root.dataset.theme = store.get("theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
$("#theme").onclick = () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; store.set("theme", root.dataset.theme); };

// ---------------------------------------------------------------- hero
["Spring Boot 3 · Java 21", "Spring Cloud", "React 18", "MySQL 8.4", "JWT · RBAC", "WebRTC", "Docker", "Offline-first"].forEach((t) => $("#stack-chips").append(el("li", {}, t)));
const heroIds = ["pat-01-dashboard", "adm-01-dashboard", "pat-08-community", "doc-01-dashboard", "pat-03-find-doctor", "doc-09-call"].filter((i) => byId[i]);
let h = 0; const heroImg = $("#hero-img");
const showHero = () => { const s = byId[heroIds[h]]; heroImg.style.opacity = 0; setTimeout(() => { heroImg.src = s.file; heroImg.onload = () => (heroImg.style.opacity = 1); $("#hero-caption").textContent = s.title + " · " + s.caption.split(".")[0]; $("#hero-url").textContent = urlOf(s); }, 260); };
const urlOf = (s) => ({ "ops-01-eureka": "localhost:8761", "pub-07-mailbox": "localhost:3100/common/mailbox", "pub-08-medicines": "localhost:3100/common/medicines", "pub-12-search": "localhost:3100/common/search", "pat-01-dashboard": "localhost:3100/health/patient", "adm-01-dashboard": "localhost:3100/health/admin", "doc-01-dashboard": "localhost:3100/health/doctor", "pat-08-community": "localhost:3100/health/community", "pat-03-find-doctor": "localhost:3100/health/appointment", "doc-09-call": "localhost:3100/tele/call/DFS1-PER1-99" }[s.id] || "localhost:3100");
showHero(); setInterval(() => { h = (h + 1) % heroIds.length; showHero(); }, 4200);

// ---------------------------------------------------------------- stats
const S = stats, k = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));
const statItems = [[S.system.services, "microservices"], [S.code.endpoints, "REST endpoints"], [S.quality.screens, "screens captured"], [k(S.code.backendLines + S.code.frontendLines), "lines of code"], [S.system.patients + S.system.doctors + 2, "seeded users"], [S.system.appointments, "appointments"], [S.quality.e2eChecks + "/" + S.quality.e2eChecks, "UI checks passing"], [S.quality.cloudDependencies, "cloud dependencies"]];
const statsEl = $("#stats");
statItems.forEach(([v, label]) => { const d = el("div", { className: "stat" }, `<b data-v="${v}">0</b><span>${label}</span>`); statsEl.append(d); });
const countUp = (b) => { const raw = String(b.dataset.v), num = parseFloat(raw); if (isNaN(num) || /[k/]/.test(raw)) { b.textContent = raw; return; } const t0 = performance.now(); const tick = (t) => { const p = Math.min(1, (t - t0) / 1100); b.textContent = Math.round(num * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { statsEl.querySelectorAll("b").forEach(countUp); o.disconnect(); } }), { threshold: 0.4 }).observe(statsEl);
$("#generated").textContent = "Data captured " + new Date(S.generatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

// ---------------------------------------------------------------- tour
const GROUPS = [["patient", "Patient"], ["doctor", "Doctor"], ["admin", "Admin"], ["public", "Public site"], ["ops", "Platform"]];
let group = "patient", idx = 0, playing = true, t0 = performance.now(), hovering = false;
const DWELL = 6500;
const list = () => shots.filter((s) => s.group === group);
const tabs = $("#tour-tabs");
GROUPS.forEach(([g, label]) => { const n = shots.filter((s) => s.group === g).length; if (!n) return; const b = el("button", { className: "tab", role: "tab", onclick: () => { group = g; idx = 0; render(); } }, `${label}<small>${n}</small>`); b.dataset.g = g; tabs.append(b); });
const stageImg = $("#stage-img"), vp = $("#viewport");
function render() {
  tabs.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.g === group));
  const l = list(), s = l[idx];
  stageImg.src = s.file; stageImg.alt = s.title; vp.scrollTop = 0;
  $("#stage-url").textContent = urlOf(s); $("#stage-title").textContent = s.title; $("#stage-caption").textContent = s.caption;
  $("#counter").textContent = `${GROUPS.find((g) => g[0] === group)[1]} · ${idx + 1} of ${l.length}`;
  const th = $("#thumbs"); th.innerHTML = "";
  l.forEach((x, i) => { const b = el("button", { title: x.title, onclick: () => { idx = i; render(); } }); b.className = i === idx ? "on" : ""; b.append(el("img", { src: x.file, alt: x.title, loading: "lazy" })); th.append(b); });
  const cur = th.children[idx]; if (cur) th.scrollTo({ left: cur.offsetLeft - th.clientWidth / 2 + cur.clientWidth / 2, behavior: "smooth" }); // scroll the strip only, never the page
  t0 = performance.now();
}
const step = (d) => { const n = list().length; idx = (idx + d + n) % n; render(); };
$("#next").onclick = () => step(1); $("#prev").onclick = () => step(-1);
$("#play").onclick = () => { playing = !playing; $("#play").textContent = playing ? "❚❚" : "▶"; t0 = performance.now(); };
document.addEventListener("keydown", (e) => { if (!$("#lightbox").hidden) return; if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
vp.addEventListener("mouseenter", () => (hovering = true)); vp.addEventListener("mouseleave", () => { hovering = false; t0 = performance.now(); });
// Autoplay: advance every few seconds; tall pages slowly scroll so the whole screen is seen.
let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.2 }).observe($("#tour"));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduce) { playing = false; $("#play").textContent = "▶"; }
(function loop(now) {
  if (playing && visible && !hovering) {
    const p = Math.min(1, (now - t0) / DWELL); $("#progress-bar").style.width = p * 100 + "%";
    const over = stageImg.clientHeight - vp.clientHeight; if (over > 0) vp.scrollTop = over * Math.max(0, (p - 0.15) / 0.8);
    if (p >= 1) step(1);
  }
  requestAnimationFrame(loop);
})(performance.now());
stageImg.onclick = () => openLightbox(shots.indexOf(list()[idx]), shots);
render();

// ---------------------------------------------------------------- capability cards
const CAPS = [
  ["🧠", "AI-assisted health report", "Finds the two most similar anonymised cases, then a local analyst writes a three-part report: overview, comparable outcomes and next steps. No cloud LLM, no data leaves the server.", "pat-06-ai-report", "var(--amber)"],
  ["🎥", "Telemedicine without a vendor", "Access is verified against the appointment window, then the browsers connect peer to peer over WebRTC with mute, camera and link controls.", "doc-09-call", "var(--teal)"],
  ["📬", "Local mailbox for OTP and alerts", "Email, SMS and push providers are replaced by an outbox, so sign-up codes and reminders are visible even on an air-gapped machine.", "pub-07-mailbox", "var(--green, #4cd964)"],
  ["📅", "Capacity-aware scheduling", "Doctors set in-person, telemedicine or off per shift with capacities; patients see live booked counts, delays and automatic reminders.", "pat-04-book", "var(--blue)"],
  ["🛡️", "Role-based security", "JWT with patient, doctor and admin roles, an internal service role, doctor approval workflow and admin-only operations enforced per route.", "adm-03-doctors", "var(--violet)"],
  ["🌍", "Ten-language interface", "Every UI string is translated per user from a dictionary loaded offline; the translator integration is only used for free-text posts.", "pub-03-login-bn", "var(--pink)"],
  ["🔎", "One search for everything", "A help-desk service fans a query out to patients, doctors, medicines, appointments and community posts.", "pub-12-search", "var(--blue)"],
  ["📊", "Operational statistics", "Daily volume, shift distribution and consultation mix computed from two thousand real appointment records.", "adm-05-statistics", "var(--amber)"],
];
CAPS.forEach(([ic, title, text, shot, color]) => { const c = el("article", { className: "card reveal", onclick: () => jumpTo(shot) }, `<div class="ico">${ic}</div><h3>${title}</h3><p>${text}</p><span class="more">See it →</span>`); c.style.setProperty("--c", color); $("#cards").append(c); });
function jumpTo(id) { const s = byId[id]; if (!s) return; group = s.group; idx = list().findIndex((x) => x.id === id); render(); $("#tour").scrollIntoView({ behavior: "smooth" }); }

// ---------------------------------------------------------------- diagrams
const DIAGRAMS = [
  ["architecture", "High-level design", "15 services, one schema each, a React client and a Spring Cloud edge.", ["The SPA calls each service directly with a JWT; the API gateway and Eureka registry complete the Spring Cloud edge.", "Notification, CDSS, I18N and Account all send their outbound messages through the Integration service.", "Dashed red is the only optional internet call: translating user-written text."]],
  ["flow-auth", "Sign-up and login", "Accounts start locked and are released by a one-time code.", ["Patients and Account services cooperate: same user ID in both databases.", "OTP delivery is provider-agnostic: SMTP in production, a local outbox here.", "The signed JWT carries the role used by every service."]],
  ["flow-booking", "Appointment booking", "Capacity, delays and reminders.", ["Serial and time are computed from slot capacity and skip times already passed.", "Notification applies each user's channel preferences and do-not-disturb.", "Schedulers send reminders daily, hourly and every five minutes."]],
  ["flow-ai", "AI health report", "Similar-case search plus a local analyst.", ["Similarity is keyword overlap across condition, medicines and diagnoses.", "Similar cases are copied and anonymised before leaving the database layer.", "The analyst uses a clinical knowledge base for specialists, tests and advice."]],
  ["flow-telemedicine", "Telemedicine", "Server-verified, peer-to-peer video.", ["Join window: five minutes before to twenty minutes after the (delay-adjusted) start.", "Signalling travels through a BroadcastChannel, so no signalling server is required.", "Media is encrypted peer to peer over WebRTC."]],
  ["flow-i18n", "Offline translation", "Dictionary first, translator second.", ["The seeder pre-loads 33 interface strings in 10 languages.", "Missing strings only reach the translator when the machine is online.", "Failures are cached for a minute so pages never wait on timeouts."]],
  ["flow-runner", "One-command environment", "Clean, set up, run and seed repeatably.", ["runner.sh option 5 rebuilds the whole environment from nothing.", "The seeder uses the real APIs, plus SQL only for history the API forbids.", "An end-to-end suite and the screenshot tour run on the same stack."]],
];
const dt = $("#diagram-tabs"); let di = 0;
DIAGRAMS.forEach(([id, title], i) => dt.append(el("button", { className: "tab", role: "tab", onclick: () => { di = i; renderDiagram(); } }, title)));
function renderDiagram() {
  const [id, title, text, points] = DIAGRAMS[di];
  dt.querySelectorAll(".tab").forEach((b, i) => b.setAttribute("aria-selected", i === di));
  $("#diagram-img").src = `assets/diagrams/${id}.gif`; $("#diagram-img").alt = title; $("#diagram-title").textContent = title; $("#diagram-text").textContent = text;
  $("#diagram-points").innerHTML = points.map((p) => `<li>${p}</li>`).join(""); $("#diagram-svg").href = `assets/diagrams/${id}.svg`;
}
renderDiagram();

// ---------------------------------------------------------------- engineering
[["Azure Blob storage", "Local disk file service"], ["SMTP · Twilio SMS · Firebase push", "Local outbox + mailbox UI"], ["Hosted GPT API", "Local clinical analyst"], ["Zego cloud video", "WebRTC peer to peer"], ["Config server on a remote git repo", "Native local config"], ["Google Fonts and Maps", "System fonts, no map script"], ["Stock images from the web", "Generated SVG artwork"], ["Translator for the whole UI", "Offline dictionary (translator kept as optional)"]]
  .forEach(([a, b]) => $("#replacements").append(el("div", { className: "row" }, `<s>${a}</s><span>→</span><b>${b}</b>`)));
const SEV = { critical: "var(--pink)", high: "var(--amber)", medium: "var(--blue)", low: "var(--teal)" };
[["critical", "Secrets in source", "Cloud keys (AI, SMS, storage, email, push, video) were committed in code and config. Removed; each integration now has a local equivalent."],
 ["critical", "Authorization rules that matched nothing", "Admin-only routes (deactivate, suspend) used patterns that never matched the real paths, so any signed-in user could call them. Corrected."],
 ["high", "Plaintext doctor passwords", "Doctor passwords were also persisted unhashed in the doctor database. No longer stored."],
 ["high", "AI report crashed on every call", "The similar-case step mutated managed JPA entities to anonymise them, so Hibernate tried to flush the changes. Now works on detached copies."],
 ["high", "Telemedicine window inverted", "The join check contradicted its own message and let people in at the wrong time. Rewritten and verified."],
 ["high", "Request storm in the interface", "The translation hook re-requested on every render and looped forever. Rewritten with one shared cache."],
 ["medium", "Mock data shown as real data", "Doctor reviews, availability, personal info and stats were static samples. Wired to the services."],
 ["medium", "Features with no wiring", "Post reactions only logged to the console, the account verification button was empty, and the AI report had no screen at all. All built or connected."],
 ["medium", "Race conditions", "Pages requested /schedule//DFS1 or /posts/list/status//7 before state was ready. Guarded."],
 ["medium", "Operational defects", "Non-executable Gradle wrappers, an unsupported Gradle for the JDK, HelpDesk registered as the wrong service, a hard-coded patient ID, broken certification labels."],
 ["low", "Polish", "Typos in navigation, dull chart colours, favicon and manifest, static server crash-proofing."]]
  .forEach(([sev, t, d]) => { const li = el("li", {}, `<b><span class="tag">${sev}</span>${t}</b><span>${d}</span>`); li.style.setProperty("--sev", SEV[sev]); $("#fixes").append(li); });
[["Backend", `${S.code.backendFiles} Java files · ${k(S.code.backendLines)} lines`, ["15 Spring Boot services, 41 controllers, 165 endpoints", "Eureka registry, native config server, gateway", "JWT + role-based route security, validation, global error handling", "Schedulers for reminders, similarity engine, local analyst"]],
 ["Frontend", `${S.code.frontendFiles} source files · ${k(S.code.frontendLines)} lines`, ["React 18 workspace on the Argon dashboard theme", "Role-aware routing, i18n hook, charts, uploads", "WebRTC call room, local mailbox, AI analysis panel", "Responsive down to phone width"]],
 ["Data and operations", `${S.system.patients} patients · ${S.system.doctors} doctors · ${S.system.appointments} appointments`, ["Docker MySQL with a schema per service", "Seeder using the real APIs, deterministic data", "runner.sh with cleanup, setup, run, seed and an all-in-one mode", "Animated architecture diagrams generated from code"]],
 ["Quality", "Verified in a real browser", ["12 end-to-end UI checks that assert effects through the APIs", "Every route crawled as each role for runtime errors", "46 screens captured automatically", "Zero cloud dependencies, runs offline"]]]
  .forEach(([t, sub, pts]) => $("#pillars").append(el("div", { className: "pillar" }, `<h3>${t}</h3><div class="muted">${sub}</div><ul>${pts.map((p) => `<li>${p}</li>`).join("")}</ul>`)));

// ---------------------------------------------------------------- gallery + lightbox
$("#gallery-count").textContent = shots.length;
let filter = "all"; const gf = $("#gallery-filters");
[["all", "All"], ...GROUPS].forEach(([g, label]) => { const b = el("button", { className: "tab", role: "tab", onclick: () => { filter = g; renderGallery(); } }, label); b.dataset.g = g; gf.append(b); });
function renderGallery() {
  gf.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.g === filter));
  const items = shots.filter((s) => filter === "all" || s.group === filter), g = $("#gallery"); g.innerHTML = "";
  items.forEach((s, i) => { const f = el("figure", { onclick: () => openLightbox(i, items) }, `<img loading="lazy" src="${s.file}" alt="${s.title}"><figcaption>${s.title}<small>${s.role}</small></figcaption>`); g.append(f); });
}
renderGallery();
let lbItems = [], lbIdx = 0; const lb = $("#lightbox");
function openLightbox(i, items) { lbItems = items; lbIdx = i; drawLb(); lb.hidden = false; document.body.style.overflow = "hidden"; }
function drawLb() { const s = lbItems[lbIdx]; $("#lb-img").src = s.file; $("#lb-cap").textContent = `${s.title} · ${s.caption}`; $("#lb-img").parentElement.scrollTop = 0; }
const closeLb = () => { lb.hidden = true; document.body.style.overflow = ""; };
$("#lb-close").onclick = closeLb; $("#lb-prev").onclick = () => { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; drawLb(); }; $("#lb-next").onclick = () => { lbIdx = (lbIdx + 1) % lbItems.length; drawLb(); };
lb.onclick = (e) => { if (e.target === lb) closeLb(); };
document.addEventListener("keydown", (e) => { if (lb.hidden) return; if (e.key === "Escape") closeLb(); if (e.key === "ArrowRight") $("#lb-next").click(); if (e.key === "ArrowLeft") $("#lb-prev").click(); });

// ---------------------------------------------------------------- reveal on scroll
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((n) => io.observe(n));
