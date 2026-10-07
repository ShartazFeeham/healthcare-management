// QA crawl: visit routes as each role, report runtime errors and failing API calls, and keep screenshots.
import { launch } from "./cdp.mjs";
import { readFileSync } from "node:fs";
const BASE = "http://localhost:3100", OUT = process.argv[2] || "/tmp/shots";
const seed = JSON.parse(readFileSync(new URL("../../seeder/last-run.json", import.meta.url)));
const login = async (email, password) => (await (await fetch("http://localhost:5100/access/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identity: email, password }) })).json());
const get = async (u, t) => (await (await fetch(u, { headers: t ? { Authorization: "Bearer " + t } : {} })).json());

const admin = await login(seed.admins[0].email, seed.admins[0].password);
const doctor = await login(seed.doctors[0].email, seed.doctors[0].password);
const patient = await login(seed.patients[0].email, seed.patients[0].password);
const meds = await get("http://localhost:7300/medicines?page=0&size=3").catch(() => null);
const upcoming = await get(`http://localhost:7400/appointments/upcoming/patient/${patient.userId}`, patient.bearerToken);
const posts = await get("http://localhost:7500/posts/list/article/0/5/true", admin.bearerToken);

const common = ["/common/index", "/common/medicines", "/common/equipments", "/common/mailbox", "/public/login", "/public/register-patient", "/public/register-doctor", "/public/forgotten-password"];
const roles = {
  admin: { s: admin, routes: ["/health/admin", "/health/doctors", "/health/patients", "/health/rooms", "/health/appointment", "/health/community", "/health/notifications", "/health/settings", "/health/register-admin", "/health/create-equipments", "/health/medicines/create", `/health/posts/${posts[0]?.postId}`] },
  doctor: { s: doctor, routes: ["/health/doctor", `/health/doctors/${doctor.userId}`, "/health/doctors/edit-profile", "/health/write-treatment", "/health/community", "/health/notifications", "/health/settings", "/health/medicines/create", "/health/patients"] },
  patient: { s: patient, routes: ["/health/patient", `/health/patients/${patient.userId}`, "/health/patients/edit-profile", "/health/appointment", "/health/write-treatment", "/health/community", "/health/notifications", "/health/settings", `/health/doctors/${doctor.userId}`] },
};
const b = await launch({ port: 9346, width: 1440, height: 900 });
const report = [];
for (const [role, cfg] of [["public", null], ...Object.entries(roles)]) {
  const p = await b.newPage();
  const errs = [], urls = new Map();
  p.on((m) => {
    if (m.method === "Network.requestWillBeSent") urls.set(m.params.requestId, m.params.request.url);
    if (m.method === "Runtime.exceptionThrown") errs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split("\n")[0].slice(0, 160));
    if (m.method === "Network.responseReceived" && m.params.response.status >= 400) errs.push(`HTTP ${m.params.response.status} ${m.params.response.url.replace(/^https?:\/\/localhost:/, ":")}`);
    if (m.method === "Network.loadingFailed" && !m.params.canceled) errs.push("NETFAIL " + m.params.errorText + " " + (urls.get(m.params.requestId) || ""));
  });
  if (cfg) await p.setStorage({ token: cfg.s.bearerToken, role: cfg.s.role, email: cfg.s.email, userId: cfg.s.userId, language: "English" }, BASE);
  const list = cfg ? cfg.routes : common;
  for (const route of list) {
    errs.length = 0;
    await p.goto(BASE + route, { settle: 1600 });
    const name = route.replace(/^\//, "").replace(/[\/?=]/g, "_");
    await p.screenshot(`${OUT}/${role}-${name}.png`);
    const text = (await p.eval("document.body.innerText")).replace(/\s+/g, " ").slice(0, 90);
    report.push(`${role.padEnd(8)} ${route.padEnd(34)} ${errs.length ? "⚠ " + [...new Set(errs)].slice(0, 4).join(" ; ") : "ok"}  «${text}»`);
  }
  await p.close();
}
console.log(report.join("\n"));
await b.close();
