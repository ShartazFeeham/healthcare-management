import { launch } from "./cdp.mjs";
const b = await launch({ port: 9450, width: 1440, height: 900 }); const p = await b.newPage(); const errs = [];
p.on((m) => { if (m.method === "Runtime.exceptionThrown") errs.push("EXC " + (m.params.exceptionDetails.exception?.description || "").slice(0, 200)); if (m.method === "Network.responseReceived" && m.params.response.status >= 400) errs.push("HTTP " + m.params.response.status + " " + m.params.response.url); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const press = async (k) => { await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: { ArrowRight: 39, ArrowLeft: 37 }[k] }); await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k }); };
// desktop
await p.goto("http://localhost:4000/deck/#1", { settle: 2500 }); await wait(1500);
await p.screenshot("/tmp/shots/deck-d1.png");
for (const [n, hash] of [[2, "#2"], [4, "#4"], [8, "#8"], [11, "#11"], [12, "#12"], [13, "#13"]]) { await p.eval(`location.hash='${hash}'; location.reload()`); await wait(3200); await p.screenshot(`/tmp/shots/deck-d${n}.png`); }
// phone portrait
await p.setViewport(390, 844, 2);
for (const [n, hash] of [[1, "#1"], [2, "#2"], [4, "#4"], [12, "#12"]]) { await p.goto("http://localhost:4000/deck/" + hash, { settle: 2800 }); await wait(2200); await p.screenshot(`/tmp/shots/deck-m${n}.png`); }
console.log(errs.length ? errs.join("\n") : "no errors"); await b.close();
