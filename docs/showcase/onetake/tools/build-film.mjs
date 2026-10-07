#!/usr/bin/env node
// Packs the recorded frames and writes film.js (window.FILM) for the player.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."), TMP = "/tmp/onetake";
const raw = JSON.parse(readFileSync(join(TMP, "raw.json"), "utf8"));
const sets = { d: ["desktop", 1440, 900], p: ["phone", 390, 844] };
const w = {}; new Function("window", readFileSync(join(ROOT, "../ward-round/js/data.js"), "utf8"))(w); const R = w.ROUND;
const film = { v: 1, sets: {}, chapters: [], end: null, footnote: "Captured from a local build. The cursor path is scripted; the requests and everything it touches are real. Seeded data is synthetic." };
for (const [key, [mode, W, H]] of Object.entries(sets)) {
  console.log(mode + ":", execFileSync("python3", [join(ROOT, "tools/pack.py"), join(TMP, mode), join(ROOT, "media", key)], { encoding: "utf8" }).trim());
  film.sets[key] = { w: W, h: H, dir: `media/${key}/` };
  const map = JSON.parse(readFileSync(join(ROOT, "media", key, "map.json"), "utf8"));
  raw[mode].film.forEach((c, i) => {
    if (!film.chapters[i]) film.chapters[i] = { id: c.id, n: c.n, role: c.role, title: c.title, start: c.start, end: c.end, cues: c.cues, drawer: c.drawer };
    // collapse back-to-back frames that point at the same file
    const fr = []; c.data.frames.forEach(([t, f, alt]) => { const file = map[f]; if (!fr.length || fr[fr.length - 1][1] !== file) fr.push([t, file.replace(".webp", ""), alt]); });
    film.chapters[i][key] = { frames: fr, cursor: c.data.cursor, clicks: c.data.clicks, req: c.data.req };
  });
}
const total = film.chapters.at(-1).end;
film.end = { start: total, dur: 21000, boot: R.boot.filter((l) => /^\s*(✓|\d\))/.test(l)).slice(0, 14), e2e: { passed: R.e2e.passed, total: R.e2e.total, checks: R.e2e.checks.map((c) => [c.name, c.ms]) },
  fixes: [["Any signed-in user could deactivate accounts", "Admins only"], ["Doctor passwords stored in plaintext", "Hashed once, in one place"], ["The AI report crashed on every call", "Works on copies"], ["Video join window inverted", "5 minutes before to 20 after"], ["A render loop flooded the browser", "One request per string"], ["Mock data looked like real data", "Wired to the services"], ["Six cloud services, keys in source", "Zero cloud dependencies"]],
  numbers: [["15", "services"], ["165", "endpoints"], ["54", "users"], ["2,011", "appointments"], ["12/12", "checks pass"]], diff: R.diffs.P4 };
film.total = total + film.end.dur;
writeFileSync(join(ROOT, "film.js"), "window.FILM = " + JSON.stringify(film) + ";\n");
console.log("film.js", Math.round(JSON.stringify(film).length / 1024) + " KB, total", (film.total / 1000).toFixed(1) + "s");
