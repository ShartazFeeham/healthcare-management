import { launch } from "./cdp.mjs";
import { readFileSync } from "node:fs";
const seed = JSON.parse(readFileSync(new URL("../../seeder/last-run.json", import.meta.url)));
const login = async (e, p) => (await fetch("http://localhost:5100/access/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identity: e, password: p }) })).json();
const doc = await login(seed.doctors[0].email, seed.doctors[0].password);
const b = await launch({ port: 9370 });
const p = await b.newPage();
await p.setStorage({ token: doc.bearerToken, role: doc.role, userId: doc.userId, email: doc.email, language: "English" }, "http://localhost:3100");
for (const path of ["/public/register-patient", "/public/verify-email?email=x@y.z", "/public/forgotten-password", "/health/write-treatment", "/health/community"]) {
  await p.goto("http://localhost:3100" + path, { settle: 1500 });
  console.log("\n" + path);
  console.log(await p.eval(`[...document.querySelectorAll('input,select,textarea,button')].filter(e=>e.offsetParent).map(e=>e.tagName.toLowerCase()+'['+(e.type||'')+'] name='+(e.name||'')+' ph='+(e.placeholder||'')+' txt='+(e.innerText||'').slice(0,25)+' id='+e.id).join('\\n')`));
}
await b.close();
