#!/usr/bin/env node
// Walks through every feature of the running app in headless Chrome and saves one screenshot per screen,
// plus site/data/shots.json (titles and captions) for the showcase site.
//   node tour.mjs              all scenes
//   node tour.mjs patient      only scenes of one group (public|admin|doctor|patient|ops)
import { launch } from "./cdp.mjs";
import { SCENES } from "./scenes.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../site/assets/shots");
mkdirSync(OUT, { recursive: true }); mkdirSync(join(HERE, "../site/data"), { recursive: true });
const BASE = "http://localhost:3100";
const only = process.argv[2];
const seed = JSON.parse(readFileSync(join(HERE, "../../seeder/last-run.json")));

const login = async (email, password) => (await fetch("http://localhost:5100/access/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identity: email, password }) })).json();
const sessions = {
  admin: await login(seed.admins[0].email, seed.admins[0].password),
  doctor: await login(seed.doctors[0].email, seed.doctors[0].password),
  patient: await login(seed.patients[0].email, seed.patients[0].password),
};
const ctx = { BASE, seed, sessions, OUT };

const browser = await launch({ port: 9350, width: 1440, height: 900, scale: 1.5 });
const pages = {};
const pageFor = async (role) => {
  if (pages[role]) return pages[role];
  const p = await browser.newPage();
  const s = sessions[role];
  await p.setStorage(s ? { token: s.bearerToken, role: s.role, email: s.email, userId: s.userId, language: "English" } : { language: "English" }, BASE);
  return (pages[role] = p);
};

let manifest = [];
try { manifest = JSON.parse(readFileSync(join(HERE, "../site/data/shots.json"), "utf8")); } catch { /* first run */ }
const byId = new Map(manifest.map((m) => [m.id, m]));

for (const scene of SCENES) {
  if (only && scene.group !== only && scene.id !== only) continue;
  const p = await pageFor(scene.role);
  try {
    await p.setViewport(scene.mobile ? 390 : 1440, scene.mobile ? 844 : 900, scene.mobile ? 2 : 1.5);
    const cleanup = await scene.run(p, { ...ctx, browser, pageFor });
    await p.idle(500);
    const file = `${scene.id}.jpg`;
    await p.screenshot(join(OUT, file), { full: !!scene.full });
    if (typeof cleanup === "function") await cleanup();
    byId.set(scene.id, { id: scene.id, file: `assets/shots/${file}`, group: scene.group, role: scene.role || "public", title: scene.title, caption: scene.caption, tags: scene.tags || [], mobile: !!scene.mobile });
    console.log("✓", scene.id.padEnd(26), scene.title);
  } catch (e) {
    console.log("✗", scene.id.padEnd(26), e.message.split("\n")[0]);
  }
  await p.setViewport(1440, 900, 1.5).catch(() => {});
}
const order = new Map(SCENES.map((s, i) => [s.id, i]));
writeFileSync(join(HERE, "../site/data/shots.json"), JSON.stringify([...byId.values()].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)), null, 1));
await browser.close();
