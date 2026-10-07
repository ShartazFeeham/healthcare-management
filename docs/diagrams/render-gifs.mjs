// Renders each diagram SVG to an animated GIF by stepping the SMIL timeline frame by frame in headless Chrome.
// Needs: Google Chrome, python3 with Pillow. usage: node render-gifs.mjs [name...]
import { launch } from "../showcase/tools/cdp.mjs";
import { readFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(readFileSync(join(HERE, "meta.json"), "utf8"));
const only = process.argv.slice(2);
const FPS = 10, SCALE = 0.8;
const browser = await launch({ port: 9395, width: 1200, height: 800, scale: SCALE });
const page = await browser.newPage({ width: 1200, height: 800, scale: SCALE });
for (const [name, m] of Object.entries(meta)) {
  if (only.length && !only.includes(name)) continue;
  const dir = `/tmp/hc-frames/${name}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  await page.setViewport(m.w, m.h, SCALE);
  await page.goto("file://" + join(HERE, name + ".svg"), { settle: 300 });
  const frames = Math.round(m.dur * FPS);
  for (let i = 0; i < frames; i++) {
    await page.eval(`(() => { const s = document.documentElement; s.pauseAnimations(); s.setCurrentTime(${(i / FPS).toFixed(3)}); })()`);
    await page.screenshot(join(dir, String(i).padStart(4, "0") + ".png"), { clip: { x: 0, y: 0, width: m.w, height: m.h } });
  }
  execFileSync("python3", [join(HERE, "frames2gif.py"), dir, join(HERE, name + ".gif"), String(1000 / FPS)], { stdio: "inherit" });
  console.log("rendered", name + ".gif", frames + " frames");
}
await browser.close();
