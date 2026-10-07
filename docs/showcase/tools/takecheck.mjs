import { launch } from "./cdp.mjs";
const b = await launch({ port: 9470, width: 1440, height: 900 }); const p = await b.newPage(); const errs = [];
p.on((m) => { if (m.method === "Runtime.exceptionThrown") errs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 220)); if (m.method === "Network.responseReceived" && m.params.response.status >= 400) errs.push("HTTP " + m.params.response.status + " " + m.params.response.url); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await p.goto("http://localhost:4000/onetake/", { settle: 2000 }); await p.screenshot("/tmp/shots/take-poster.png");
for (const [name, sec] of [["signin", 11], ["book", 36], ["doctor", 52], ["call", 78], ["report", 95], ["end", 118]]) { await p.goto(`http://localhost:4000/onetake/?t=${sec}`, { settle: 1500 }); await wait(1200); await p.screenshot(`/tmp/shots/take-d-${name}.png`); }
// real playback for 6s
await p.goto("http://localhost:4000/onetake/", { settle: 1500 }); await p.click("#play"); await wait(6500); console.log("playing t:", await p.eval("document.getElementById('time').textContent"));
// phone
await p.setViewport(390, 844, 2);
for (const [name, sec] of [["poster", 0], ["book", 36], ["call", 78]]) { await p.goto(`http://localhost:4000/onetake/${sec ? "?t=" + sec : ""}`, { settle: 1800 }); await wait(1200); await p.screenshot(`/tmp/shots/take-m-${name}.png`); }
console.log(errs.length ? errs.join("\n") : "no errors"); await b.close();
