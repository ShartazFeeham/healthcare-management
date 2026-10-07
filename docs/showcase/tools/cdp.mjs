// Minimal Chrome DevTools Protocol driver. Zero dependencies: it uses the installed Google Chrome
// and Node's built-in WebSocket, so nothing has to be downloaded to take screenshots.
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Page {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
    ws.addEventListener("message", (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej } = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) this.listeners.forEach((l) => l(msg));
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  on(fn) { this.listeners.push(fn); }

  async init({ width, height, scale }) {
    await this.send("Page.enable"); await this.send("Runtime.enable"); await this.send("Network.enable");
    await this.setViewport(width, height, scale);
    // Every tab believes it is focused and visible, so background tabs keep rendering and streaming video.
    await this.send("Emulation.setFocusEmulationEnabled", { enabled: true }).catch(() => {});
  }
  setViewport(width, height, scale = 1) {
    this.viewport = { width, height, scale };
    return this.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
  }
  async goto(url, { settle = 900 } = {}) {
    const loaded = new Promise((r) => { const h = (m) => { if (m.method === "Page.loadEventFired") r(); }; this.on(h); setTimeout(r, 20000); });
    await this.send("Page.navigate", { url });
    await loaded; await this.idle(settle);
  }
  // Wait until no network request has started for `quiet` ms (cheap network-idle).
  async idle(quiet = 700, max = 15000) {
    let last = Date.now(); const h = (m) => { if (m.method === "Network.requestWillBeSent") last = Date.now(); };
    this.on(h); const start = Date.now();
    while (Date.now() - last < quiet && Date.now() - start < max) await sleep(100);
    this.listeners = this.listeners.filter((l) => l !== h);
  }
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async waitFor(expr, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) { try { if (await this.eval(expr)) return true; } catch { /* page navigating */ } await sleep(200); }
    throw new Error("timeout waiting for: " + expr);
  }
  waitText(text, timeout) { return this.waitFor(`document.body && document.body.innerText.includes(${JSON.stringify(text)})`, timeout); }
  // Locate an element by CSS selector, or by visible text (`text=Some label`), and return its centre.
  async locate(target) {
    const expr = target.startsWith("text=")
      ? `(() => { const t=${JSON.stringify(target.slice(5))}; const all=[...document.querySelectorAll('button,a,label,[role=button],li,span,div,h1,h2,h3,h4,h5,p,td')]; const area=(e)=>{const r=e.getBoundingClientRect();return r.width*r.height;}; const els=all.filter(e=>e.children.length<4 && (e.innerText||'').trim()===t && area(e)>0).sort((a,b)=>area(a)-area(b)); const e=els[0]||all.find(e=>(e.innerText||'').trim().startsWith(t)&&e.children.length<4); if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`
      : `(() => { const e=document.querySelector(${JSON.stringify(target)}); if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`;
    const start = Date.now();
    while (Date.now() - start < 10000) { const p = await this.eval(expr); if (p) return p; await sleep(200); }
    throw new Error("element not found: " + target);
  }
  async click(target, { settle = 500 } = {}) {
    const { x, y } = await this.locate(target);
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    await sleep(settle);
  }
  async type(selector, text, { clear = true } = {}) {
    await this.click(selector, { settle: 100 });
    if (clear) await this.eval(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(e && e.select) e.select(); })()`);
    if (clear) await this.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 }), await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
    await this.send("Input.insertText", { text });
  }
  // Sets a <select> the way a user would, so React sees the change event.
  async select(selector, value) {
    await this.eval(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); const want=${JSON.stringify(value)}; const opt=[...e.options].find(o=>o.value===want||o.text.trim()===want); const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; set.call(e, opt?opt.value:want); e.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  }
  async press(key) {
    const codes = { Enter: 13, Escape: 27, Tab: 9 };
    const p = { key, code: key, windowsVirtualKeyCode: codes[key] || 0, text: key === "Enter" ? "\r" : undefined };
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", ...p }); await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...p });
  }
  async setStorage(entries, origin) {
    await this.goto(origin + "/robots.txt", { settle: 100 });
    for (const [k, v] of Object.entries(entries)) await this.eval(`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
  }
  async clearStorage() { await this.eval("localStorage.clear(); sessionStorage.clear();").catch(() => {}); }
  async screenshot(path, { full = false, clip } = {}) {
    mkdirSync(dirname(path), { recursive: true });
    let params = { format: path.endsWith(".png") ? "png" : "jpeg", quality: 90, captureBeyondViewport: !!clip };
    if (full) {
      const h = await this.eval("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)");
      const { width, scale } = this.viewport;
      await this.setViewport(width, Math.min(h, 4000), scale); await sleep(400);
      params.clip = { x: 0, y: 0, width, height: Math.min(h, 4000), scale: 1 };
    } else if (clip) params.clip = { ...clip, scale: 1 };
    const { data } = await this.send("Page.captureScreenshot", params);
    await writeFile(path, Buffer.from(data, "base64"));
    if (full) await this.setViewport(this.viewport.width, this.initialHeight, this.viewport.scale);
  }
  async close() { try { this.ws.close(); } catch { /* ignore */ } }
}

export async function launch({ port = 9333, width = 1440, height = 900, scale = 1, headless = true, args = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "hc-chrome-"));
  const proc = spawn(CHROME, [
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, headless ? "--headless=new" : "", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required", "--disable-features=Translate,MediaRouter,WebRtcHideLocalIpsWithMdns", "--disable-background-networking",
    `--window-size=${width},${height}`, "--force-color-profile=srgb", ...args, "about:blank",
  ].filter(Boolean), { stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(250); } }
  const browser = {
    proc, port, pages: [],
    async newPage(opts = {}) {
      const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
      const ws = new WebSocket(t.webSocketDebuggerUrl);
      await new Promise((r) => ws.addEventListener("open", r));
      const page = new Page(ws); page.targetId = t.id; page.initialHeight = opts.height || height;
      await page.init({ width: opts.width || width, height: opts.height || height, scale: opts.scale || scale });
      browser.pages.push(page); return page;
    },
    async close() { browser.pages.forEach((p) => p.close()); proc.kill(); },
  };
  return browser;
}
