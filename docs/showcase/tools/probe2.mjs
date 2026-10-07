import { launch } from "./cdp.mjs";
const b = await launch({ port: 9345 });
const p = await b.newPage();
const out = [];
p.on((m) => {
  if (m.method === "Runtime.exceptionThrown") out.push("EXC " + JSON.stringify(m.params.exceptionDetails).slice(0, 600));
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) out.push("CONSOLE " + m.params.type + " " + m.params.args.map((a) => a.value || a.description || "").join(" ").slice(0, 300));
  if (m.method === "Network.loadingFailed") out.push("NETFAIL " + m.params.errorText);
  if (m.method === "Network.responseReceived" && m.params.response.status >= 400) out.push("HTTP " + m.params.response.status + " " + m.params.response.url);
});
await p.goto("http://localhost:3100/public/login", { settle: 2500 });
console.log((await p.eval("document.getElementById('root').innerHTML.length")), (await p.eval("document.body.innerText")).slice(0, 100));
console.log(out.join("\n"));
await b.close();
