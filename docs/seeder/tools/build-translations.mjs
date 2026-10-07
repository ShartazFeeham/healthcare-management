#!/usr/bin/env node
// One-off helper (needs internet once): extracts every text("tag", "default") call from the frontend and
// translates it through the platform's own translator integration into data/translations.json.
// The seeder then loads that file, so the UI is translated even when the machine is offline.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "../../../FrontEnd/src");
const LANGS = { zh: "Chinese", es: "Spanish", hi: "Hindi", ar: "Arabic", bn: "Bengali", pt: "Portuguese", ru: "Russian", ja: "Japanese", de: "German" };
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? (f !== "assets" && walk(p)) : /\.jsx?$/.test(f) && files.push(p); } })(SRC);

const OUT = join(HERE, "../data/translations.json");
let resources = {};
try { resources = JSON.parse(readFileSync(OUT, "utf8")).resources; } catch { /* first run */ }
const re = /\btext\(\s*"([A-Za-z0-9_-]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g;
for (const f of files) { const s = readFileSync(f, "utf8"); let m; while ((m = re.exec(s))) resources[m[1]] = { ...(resources[m[1]] || {}), en: m[2] }; }
console.log(`${Object.keys(resources).length} interface strings found`);

for (const [tag, entry] of Object.entries(resources)) {
  for (const code of Object.keys(LANGS)) {
    if (entry[code]) continue; // already translated on an earlier run
    for (let attempt = 1; attempt <= 5 && !entry[code]; attempt++) {
      const res = await fetch("http://localhost:5300/v1/translation/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: "en", to: code, text: entry.en }) });
      if (res.ok) entry[code] = (await res.text()).trim();
      else await new Promise((r) => setTimeout(r, 1500 * attempt)); // the free endpoint throttles bursts
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!entry[code]) console.log(`  ! ${tag} -> ${code}: gave up`);
  }
}
const languages = [{ languageCode: "en", languageName: "English" }, ...Object.entries(LANGS).map(([languageCode, languageName]) => ({ languageCode, languageName }))];
for (const e of Object.values(resources)) e.en = e.en;
writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), languages, resources }, null, 1));
console.log("wrote data/translations.json");
