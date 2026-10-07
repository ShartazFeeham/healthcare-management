#!/usr/bin/env node
// Gathers real data into js/data.js (window.ROUND) so the page works from file:// with no fetch.
//  - appointment pulse + mix from the admin statistics endpoint
//  - endpoint counts per service from the controllers
//  - real startup lines from the service logs, real e2e results, real diffs from git
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, ".."), REPO = join(ROOT, "../../..");
const seed = JSON.parse(readFileSync(join(ROOT, "../../seeder/last-run.json")));
const login = async (e, p) => (await fetch("http://localhost:5100/access/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identity: e, password: p }) })).json();
const admin = await login(seed.admins[0].email, seed.admins[0].password);
const J = async (u) => (await fetch(u, { headers: { Authorization: "Bearer " + admin.bearerToken } })).json();

// ---- pulse
const s = await J("http://localhost:7400/appointments/stats");
const daily = s.dailyStats.map((d) => ({ date: d.date ?? d.DATE ?? Object.values(d)[0], n: Number(d.count ?? d.COUNT ?? Object.values(d)[1]) })).sort((a, b) => (a.date < b.date ? -1 : 1));
const mix = { shifts: Object.fromEntries(s.shifts.map((x) => [x.shift ?? Object.values(x)[0], Number(x.count ?? Object.values(x)[1])])), types: Object.fromEntries(s.type.map((x) => [x.type ?? Object.values(x)[0], Number(x.count ?? Object.values(x)[1])])) };
const stats = JSON.parse(readFileSync(join(ROOT, "../site/data/stats.json")));

// ---- services: ports and endpoint counts
const SERVICES = [["discovery", "DiscoveryServer", 8761, "Service registry"], ["config", "ConfigServer", 8888, "Local config files"], ["account", "Account", 5100, "Login, JWT, OTP, roles"], ["filestorage", "FileStorage", 5200, "Uploads on disk"], ["integration", "Integration", 5300, "Outbox, analyst, translator"], ["i18n", "I18N", 5400, "Languages and strings"], ["patients", "PatientsData", 7100, "Profiles, challenges"], ["doctors", "DoctorData", 7200, "Profiles, rooms"], ["medicines", "Medicines", 7300, "Pharmacy library"], ["appointments", "Appointment", 7400, "Slots, delays, reviews"], ["community", "Community", 7500, "Posts, comments"], ["notifications", "Notification", 7600, "Alerts, preferences"], ["helpdesk", "HelpDesk", 7700, "Unified search"], ["cdss", "CDSS", 7800, "Treatments, AI report"], ["gateway", "APIGateway", 9999, "Edge routing"]];
const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? (f !== "build" && f !== ".gradle" && walk(p, out)) : f.endsWith(".java") && out.push(p); } return out; };
const services = SERVICES.map(([id, dir, port, role], order) => {
  const files = walk(join(REPO, "BackEnd", dir, "src/main"));
  const endpoints = files.reduce((n, f) => n + (readFileSync(f, "utf8").match(/@(Get|Post|Put|Delete|Patch)Mapping/g) || []).length, 0);
  const log = join(REPO, "docs/.run/logs", id + ".log"); let started = null;
  if (existsSync(log)) { const m = readFileSync(log, "utf8").match(/Started (\w+) in ([\d.]+) seconds/); if (m) started = Number(m[2]); }
  return { id, name: dir, port, role, endpoints, startedIn: started, order, schema: ["account", "patients", "doctors", "medicines", "appointments", "community", "notifications", "cdss", "i18n"].includes(id) ? "healthcare_" + ({ account: "accounts", i18n: "internationalization" }[id] || id.replace("appointments", "appointments")) : null };
});

// ---- real runner transcript (ANSI stripped, trimmed)
let boot = [];
const runLog = "/tmp/runner5.log";
if (existsSync(runLog)) boot = readFileSync(runLog, "utf8").replace(/\x1b\[[0-9;]*m/g, "").split("\n").map((l) => l.trimEnd()).filter((l) => /^\s*(✓|\d\)|Ready|Done|\[\d+\])/.test(l) || /^\s{3}✓/.test(l)).slice(0, 60);

// ---- counts straight from the databases, and a real (truncated) password hash
const q = (db, sql) => execFileSync("docker", ["exec", "-i", "healthcare-mysql", "mysql", "-uhealthcare", "-phealthcare", "-N", db, "-e", sql], { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
const counts = { users: Number(q("healthcare_accounts", "select count(*) from account")), reviews: Number(q("healthcare_appointments", "select count(*) from review")), treatments: Number(q("healthcare_cdss", "select count(*) from treatment")), reports: Number(q("healthcare_cdss", "select count(*) from report")), posts: Number(q("healthcare_community", "select count(*) from posts")), comments: Number(q("healthcare_community", "select count(*) from comments")), notifications: Number(q("healthcare_notifications", "select count(*) from notification")), translations: Number(q("healthcare_internationalization", "select count(*) from translation")) };
const hash = q("healthcare_accounts", "select password from account where user_id='DIC1'");
const hashSample = hash.slice(0, 13) + "…" + "•".repeat(8);

// ---- e2e
const e2e = JSON.parse(readFileSync(join(REPO, "docs/tests/last-run.json")));

// ---- real diffs of the fixes (uncommitted work vs HEAD)
const FIXES = [ // [id, file, regex that identifies the interesting hunk]
  ["P1", "BackEnd/Account/src/main/java/com/healthcare/account/security/SecurityConfig.java", /getEmail|toggle-/],
  ["P2", "BackEnd/DoctorData/src/main/java/com/healthcare/doctordata/services/implemenatations/DoctorServiceImpl.java", /assword/],
  ["P3", "BackEnd/CDSS/src/main/java/com/healthcare/cdss/services/CDSSServiceImpl.java", /Anonymise|HIDDEN/],
  ["P4", "BackEnd/Appointment/src/main/java/com/healtcare/appointments/services/implementations/TeleSecurityImpl.java", /isBefore/],
  ["P5", "FrontEnd/src/components/internationalization/i18n.jsx", /requested|cache/],
  ["P6", "FrontEnd/src/components/profiles/DoctorProfileReviews.jsx", /AxiosInstance/],
  ["P7", "BackEnd/Appointment/src/main/java/com/healtcare/appointments/services/implementations/DelayServiceImpl.java", /isBefore|isAfter/],
];
const diffs = {};
for (const [id, f, want] of FIXES) {
  let d = ""; try { d = execFileSync("git", ["diff", "HEAD", "-U2", "--", f], { cwd: REPO, encoding: "utf8" }); } catch { /* not tracked */ }
  const lines = d.split("\n").filter((l) => !/^(diff|index|---|\+\+\+)/.test(l));
  const hunks = lines.join("\n").split(/^@@.*@@.*$/m).filter(Boolean); // keep the hunk that holds the actual fix, not unrelated edits
  const hunk = hunks.find((h) => h.split("\n").some((l) => /^[+-]/.test(l) && want.test(l))) || hunks[0] || "";
  diffs[id] = { file: f.replace(/^.*\/(src\/)/, "$1"), lines: hunk.split("\n").filter((l) => l.length).slice(0, 14) };
}

const out = { generatedAt: new Date().toISOString(), actors: { patient: { id: "PER1", name: "Eva Rahman" }, doctor: { id: "DIC1", name: "Dr. Imran Chowdhury" } }, stats, counts, hashSample, daily, mix, services, boot, e2e, diffs, captures: JSON.parse(readFileSync(join(ROOT, "data-captures.json"))) };
writeFileSync(join(ROOT, "js/data.js"), "window.ROUND = " + JSON.stringify(out) + ";\n");
console.log("daily points:", daily.length, "| services:", services.length, "| boot lines:", boot.length, "| e2e:", e2e.passed + "/" + e2e.total, "| diffs:", Object.entries(diffs).map(([k, v]) => k + ":" + v.lines.length).join(" "));
