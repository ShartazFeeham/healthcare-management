import { launch } from "./cdp.mjs";
const b = await launch({ port: 9411, width: 1440, height: 900 }); const p = await b.newPage(); const errs = [];
p.on((m) => { if (m.method === "Runtime.exceptionThrown") errs.push("EXC " + (m.params.exceptionDetails.exception?.description || "").slice(0, 200)); });
await p.goto("http://localhost:4000/ward-round/", { settle: 2500 });
await p.eval("document.documentElement.dataset.theme='light'");
await p.eval("document.getElementById('play').click()");
const seen = [];
for (let i = 0; i < 14; i++) { await new Promise(r => setTimeout(r, 4500)); seen.push((await p.eval("document.getElementById('captions').textContent")) + " @" + (await p.eval("Math.round(scrollY)"))); if (i === 5) await p.screenshot("/tmp/shots/ward-play.png"); }
console.log(seen.join("\n")); console.log("playing:", await p.eval("document.getElementById('play').getAttribute('aria-pressed')"));
// mobile
await p.eval("document.getElementById('play').click()");
await p.setViewport(390, 844, 2); await p.goto("http://localhost:4000/ward-round/", { settle: 2500 }); await p.screenshot("/tmp/shots/ward-mobile.jpg", { full: true });
// no-JS
await p.send("Emulation.setScriptExecutionDisabled", { value: true }); await p.setViewport(1440, 900, 1); await p.goto("http://localhost:4000/ward-round/", { settle: 1500 });
console.log("nojs text length:", await p.eval("document.body.innerText.length").catch(() => "n/a"));
await p.screenshot("/tmp/shots/ward-nojs.jpg", { full: true });
console.log(errs.length ? errs.join("\n") : "no errors"); await b.close();
