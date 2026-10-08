// Collects real numbers about the running system and the codebase for the showcase site.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "../../..");
const seed = JSON.parse(readFileSync(join(HERE, "../../seeder/last-run.json")));
const login = async (e, p) => (await fetch("http://localhost:5100/access/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identity: e, password: p }) })).json();
const admin = await login(seed.admins[0].email, seed.admins[0].password);
const J = async (u) => (await fetch(u, { headers: { Authorization: "Bearer " + admin.bearerToken } })).json();

const walk = (d, out = []) => { for (const f of readdirSync(d)) { if (["node_modules", "build", ".gradle", ".git", ".run", "assets"].includes(f)) continue; const p = join(d, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const count = (files, re) => files.reduce((n, f) => n + (readFileSync(f, "utf8").match(re) || []).length, 0);
const lines = (files) => files.reduce((n, f) => n + readFileSync(f, "utf8").split("\n").length, 0);
const be = walk(join(ROOT, "BackEnd")).filter((f) => f.endsWith(".java") && !f.includes("/src/test/"));
const fe = walk(join(ROOT, "FrontEnd/src")).filter((f) => /\.(jsx?|scss)$/.test(f) && !f.includes("/assets/"));
const stats = await Promise.all([
  J("http://localhost:7200/doctors/total-count"), J("http://localhost:7100/patients/total-count"), J("http://localhost:7400/appointments/total-count"),
  J("http://localhost:7300/medicines?sort=NONE&expiration=ALL&manufacturer=null"), J("http://localhost:7400/equipments/list/0/100"),
  J("http://localhost:7500/posts/list/article/0/100/true"), J("http://localhost:7500/posts/list/status/0/100/true"), J("http://localhost:7500/posts/list/firstaid/0/100/true"), J("http://localhost:7500/posts/list/feedback/0/100/true"), J("http://localhost:7500/posts/list/faq/0/100/true"),
]);
const meds = Array.isArray(stats[3]) ? stats[3].length : (stats[3].data || []).length;
const out = {
  generatedAt: new Date().toISOString(),
  system: { services: 15, doctors: stats[0], patients: stats[1], appointments: stats[2], medicines: meds, equipment: stats[4].length, posts: stats[5].length + stats[6].length + stats[7].length + stats[8].length + stats[9].length, languages: 10 },
  code: { backendFiles: be.length, backendLines: lines(be), frontendFiles: fe.length, frontendLines: lines(fe), endpoints: count(be, /@(Get|Post|Put|Delete|Patch)Mapping/g), controllers: count(be, /@RestController/g), entities: count(be, /@Entity\b/g) },
  quality: { e2eChecks: 12, screens: JSON.parse(readFileSync(join(HERE, "../deck/resources/site/data/shots.json"))).length, cloudDependencies: 0 },
};
writeFileSync(join(HERE, "../deck/resources/site/data/stats.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
