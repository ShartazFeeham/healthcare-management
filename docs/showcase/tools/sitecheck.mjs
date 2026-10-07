import { launch } from "./cdp.mjs";
const b = await launch({ port: 9400, width: 1440, height: 900 });
const p = await b.newPage(); const errs = [];
p.on((m) => { if (m.method === "Runtime.exceptionThrown") errs.push("EXC " + (m.params.exceptionDetails.exception?.description || "").slice(0, 200)); if (m.method === "Network.responseReceived" && m.params.response.status >= 400) errs.push("HTTP " + m.params.response.status + " " + m.params.response.url); if (m.method === "Network.loadingFailed") errs.push("FAIL " + m.params.errorText); });
await p.goto("http://localhost:4000/", { settle: 2500 });
// reveal everything so the full-page capture shows all sections
await p.eval("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))");
await new Promise(r=>setTimeout(r,1200));
await p.screenshot("/tmp/shots/site-top.png");
await p.screenshot("/tmp/shots/site-full.jpg", { full: true });
await p.setViewport(390, 844, 2); await p.goto("http://localhost:4000/", { settle: 2000 }); await p.eval("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))");
await p.screenshot("/tmp/shots/site-mobile.jpg", { full: true });
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
