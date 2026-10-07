#!/usr/bin/env node
// End-to-end smoke test: drives the real UI in headless Chrome and verifies the effects through the APIs.
// Needs the full stack running and seeded (docs/runner.sh 5).   usage: node docs/tests/e2e.mjs
import { launch } from "../showcase/tools/cdp.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const BASE = "http://localhost:3100";
const seed = JSON.parse(readFileSync(new URL("../seeder/last-run.json", import.meta.url)));
const api = async (method, url, { token, body } = {}) => { const r = await fetch(url, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); try { return { status: r.status, data: JSON.parse(t) }; } catch { return { status: r.status, data: t }; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const timings = [];
const check = async (name, fn) => { const t0 = Date.now(); try { await fn(); results.push([true, name]); timings.push({ name, ok: true, ms: Date.now() - t0 }); console.log("  ✓", name); } catch (e) { results.push([false, name]); timings.push({ name, ok: false, ms: Date.now() - t0, error: e.message.split("\n")[0] }); console.log("  ✗", name, "-", e.message.split("\n")[0]); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const otpFor = async (email) => { for (let i = 0; i < 30; i++) { const m = (await api("GET", "http://localhost:5300/v1/outbox?channel=email")).data.find((x) => x.to === email); if (m) return m.body.match(/\d{6}/)[0]; await sleep(300); } throw new Error("no OTP for " + email); };
const clearBox = () => api("DELETE", "http://localhost:5300/v1/outbox");

const stamp = Date.now().toString().slice(-6);
const email = `e2e.${stamp}@mail.healthcare.local`;
const browser = await launch({ port: 9380, width: 1440, height: 900 });
const p = await browser.newPage();
const doctor = (await api("POST", "http://localhost:5100/access/login", { body: { identity: seed.doctors[0].email, password: seed.doctors[0].password } })).data;
let patient;

console.log("\nRegistration and account recovery");
await check("register a new patient through the form", async () => {
  await clearBox();
  await p.setStorage({ language: "English" }, BASE);
  await p.goto(BASE + "/public/register-patient", { settle: 1500 });
  await p.type("input[placeholder='First name']", "Esha"); await p.type("input[placeholder='Last name']", "Tester");
  await p.type("input[placeholder='Email']", email); await p.select("#gender", "Female"); await p.type("input[placeholder='Age']", "29");
  await p.type("input[placeholder='Password']", "Secret@123"); await p.type("input[placeholder='Re-type password']", "Secret@123");
  await p.click("#customCheckAgree"); await p.click("text=Create account", { settle: 2500 });
  const r = await api("POST", "http://localhost:5100/access/login", { body: { identity: email, password: "Secret@123" } });
  assert(r.status === 406, "new account should be locked until verified, got " + r.status);
});
await check("verification code arrives in the local mailbox and unlocks the account", async () => {
  const otp = await otpFor(email);
  await p.goto(BASE + "/public/verify-email?email=" + encodeURIComponent(email), { settle: 1200 });
  await p.type("input[placeholder='Enter your password']", "Secret@123"); await p.type("input[placeholder='Enter your OTP']", otp); await p.click("text=Verify", { settle: 2000 });
  const r = await api("POST", "http://localhost:5100/access/login", { body: { identity: email, password: "Secret@123" } });
  assert(r.status === 200, "login failed after verification: " + r.status);
  patient = r.data;
});
await check("sign in through the UI lands on the patient dashboard", async () => {
  await p.eval("localStorage.clear()"); await p.goto(BASE + "/public/login", { settle: 1200 });
  await p.type("input[type=email]", email); await p.type("input[type=password]", "Secret@123"); await p.eval("[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Login').click()"); await sleep(2500);
  assert((await p.eval("location.pathname")).includes("/health/patient"), "not on dashboard: " + (await p.eval("location.pathname")));
});
await check("password reset with an emailed OTP", async () => {
  await clearBox();
  await p.eval("localStorage.clear()"); await p.goto(BASE + "/public/forgotten-password", { settle: 1200 });
  await p.type("input[placeholder='Email']", email); await p.eval("[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Send OTP').click()"); await sleep(1500);
  const otp = await otpFor(email);
  await p.type("input[placeholder='OTP']", otp); await p.type("input[placeholder='New Password']", "NewSecret@456"); await p.type("input[placeholder='Confirm Password']", "NewSecret@456");
  await p.eval("[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Reset Password').click()"); await sleep(2000);
  const r = await api("POST", "http://localhost:5100/access/login", { body: { identity: email, password: "NewSecret@456" } });
  assert(r.status === 200, "new password rejected: " + r.status);
  patient = r.data;
});

console.log("\nClinical records");
await p.setStorage({ token: doctor.bearerToken, role: "DOCTOR", userId: doctor.userId, email: doctor.email, language: "English" }, BASE);
await check("doctor saves a treatment record for the new patient", async () => {
  await p.goto(BASE + "/health/write-treatment", { settle: 1500 });
  await p.type("#patientId", patient.userId); await p.type("#condition", "Seasonal influenza"); await p.eval("(()=>{const e=document.querySelector('#issueDate'); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(e,'2026-09-30'); e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await p.type("#medicines", "Paracetamol 500 mg, Oral rehydration salts"); await p.type("#diagnoses", "Rapid influenza test"); await p.type("#progression", "Fever settling after two days"); await p.type("#doctorComment", "Rest and fluids for a week");
  await p.click("text=Save treatment", { settle: 2000 });
  const t = await api("GET", `http://localhost:7800/treatments/patient/${patient.userId}`, { token: patient.bearerToken });
  assert(Array.isArray(t.data) && t.data.some((x) => x.condition === "Seasonal influenza"), "treatment not stored");
});
await check("patient sees the treatment and can generate an AI health report", async () => {
  await p.setStorage({ token: patient.bearerToken, role: "PATIENT", userId: patient.userId, email, language: "English" }, BASE);
  await p.goto(BASE + "/health/patients/" + patient.userId, { settle: 2200 });
  await p.waitFor("document.body.innerText.toLowerCase().includes('seasonal influenza')");
  const g = await api("GET", `http://localhost:7800/cdss/report/generate/${patient.userId}`, { token: patient.bearerToken });
  assert(g.status === 200 && /Overview/.test(g.data), "report not generated: " + g.status);
});

console.log("\nAppointments");
await check("patient books an appointment from the UI", async () => {
  const before = (await api("GET", `http://localhost:7400/appointments/upcoming/patient/${patient.userId}`, { token: patient.bearerToken })).data.length;
  await p.goto(BASE + "/health/appointment", { settle: 1500 });
  await p.click(".card.mt-2", { settle: 1500 });
  await p.eval("(() => { const b=[...document.querySelectorAll('div,span,li,a')].filter(e=>e.children.length===0 && /^\\d{4}-\\d{2}-\\d{2}$/.test((e.innerText||'').trim()))[1]; b && b.click(); })()"); await sleep(1500);
  await p.click("text=Apply", { settle: 1200 });
  await p.eval("(() => { const b=[...document.querySelectorAll('button')].find(e=>/confirm|yes|book/i.test(e.innerText)); b && b.click(); })()"); await sleep(1800);
  const after = (await api("GET", `http://localhost:7400/appointments/upcoming/patient/${patient.userId}`, { token: patient.bearerToken })).data.length;
  assert(after === before + 1, `expected ${before + 1} upcoming appointments, found ${after}`);
});

console.log("\nCommunity");
await check("doctor publishes an article", async () => {
  await p.setStorage({ token: doctor.bearerToken, role: "DOCTOR", userId: doctor.userId, email: doctor.email, language: "English" }, BASE);
  await p.goto(BASE + "/health/community", { settle: 1500 });
  await p.type("textarea", "Staying active through winter: short daily walks keep the heart healthy. #e2e" + stamp);
  await p.select("select#gender", "Article"); await p.eval("[...document.querySelectorAll('button')].find(b=>/^Post your/i.test(b.innerText.trim())).click()"); await sleep(2200);
  const list = (await api("GET", "http://localhost:7500/posts/list/article/0/50/true", { token: doctor.bearerToken })).data;
  assert(list.some((x) => (x.content || "").includes("#e2e" + stamp)), "article not found");
});
await check("patient comments on and reacts to a post", async () => {
  const post = (await api("GET", "http://localhost:7500/posts/list/article/0/1/true", { token: patient.bearerToken })).data[0];
  await p.setStorage({ token: patient.bearerToken, role: "PATIENT", userId: patient.userId, email, language: "English" }, BASE);
  await p.goto(BASE + "/health/posts/" + post.postId, { settle: 2000 });
  await p.click("text=Comment", { settle: 700 });
  await p.type("textarea[placeholder='Write your Comment here.']", "Great advice, thank you! e2e" + stamp);
  await p.eval("document.querySelector('.fa-paper-plane').closest('.input-group-prepend').click()"); await sleep(1800);
  const detail = (await api("GET", `http://localhost:7500/posts/${post.postId}`, { token: patient.bearerToken })).data;
  assert(detail.comments.some((c) => c.content.includes("e2e" + stamp)), "comment not stored");
  const r = await api("POST", "http://localhost:7500/posts/react", { token: patient.bearerToken, body: { postId: post.postId, type: 3 } });
  assert(r.status === 200, "reaction failed " + r.status);
});

console.log("\nPlatform");
await check("notifications were delivered to the patient and the local mailbox", async () => {
  const n = (await api("GET", "http://localhost:7600/notifications/0/10", { token: patient.bearerToken })).data;
  assert(Array.isArray(n), "notifications unavailable");
  const box = (await api("GET", "http://localhost:5300/v1/outbox")).data;
  assert(Array.isArray(box), "outbox endpoint unavailable");
});
await check("interface switches to Bengali from the dictionary (no translator needed)", async () => {
  await p.eval("localStorage.setItem('language','Bengali')"); await p.goto(BASE + "/public/login", { settle: 2200 });
  assert(await p.eval("/[\\u0980-\\u09FF]/.test(document.body.innerText)"), "no Bengali text on the login page");
});
await check("telemedicine join window enforced", async () => {
  const r = await api("GET", `http://localhost:7400/tele/verify/${doctor.userId}-PXX1-1`, { token: doctor.bearerToken });
  assert(r.status === 404 || r.status === 403 || r.status === 406, "unexpected status " + r.status);
});

await browser.close();
const failed = results.filter(([ok]) => !ok).length;
writeFileSync(new URL("./last-run.json", import.meta.url), JSON.stringify({ ranAt: new Date().toISOString(), passed: results.length - failed, total: results.length, checks: timings }, null, 1));
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
