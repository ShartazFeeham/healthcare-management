import { launch } from "./cdp.mjs";
const b = await launch({ port: 9410, width: 1440, height: 900 });
const p = await b.newPage(); const errs = [];
p.on((m) => { if (m.method === "Runtime.exceptionThrown") errs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 240)); if (m.method === "Network.responseReceived" && m.params.response.status >= 400) errs.push("HTTP " + m.params.response.status + " " + m.params.response.url); if (m.method === "Network.loadingFailed") errs.push("FAIL " + m.params.errorText); });
await p.goto("http://localhost:4000/ward-round/", { settle: 3500 });
await p.screenshot("/tmp/shots/ward-top.png");
for (const [n, sel] of [["admission", "#admission"], ["vitals", "#vitals"], ["exam", "#scene-0"], ["exam3", "#scene-3"], ["problems", "#problems"], ["plan", "#plan"], ["discharge", "#discharge"]]) {
  await p.eval(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'start'})`); await new Promise(r => setTimeout(r, 3800));
  if (n === "vitals") await p.eval("(() => { const r=document.querySelector('.ecg').getBoundingClientRect(); })()");
  await p.screenshot(`/tmp/shots/ward-${n}.png`);
}
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
