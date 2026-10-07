import { launch } from "./cdp.mjs";
const b = await launch({ port: 9451, width: 1440, height: 900 }); const p = await b.newPage(); const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = async (k) => { const code = { ArrowRight: 39, ArrowLeft: 37 }[k]; await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: code }); await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: code }); await wait(350); };
const state = () => p.eval("JSON.stringify({hash: location.hash, active: document.querySelector('.slide[data-state=active]').dataset.id, phrase: [...document.querySelectorAll('.slide[data-state=active] .phrases li')].findIndex(l=>l.classList.contains('in')), mode: document.body.dataset.mode})");
await p.goto("http://localhost:4000/deck/#2", { settle: 2000 });
console.log("start", await state()); for (let i = 0; i < 4; i++) { await key("ArrowRight"); console.log("→", await state()); }
await key("ArrowLeft"); console.log("←", await state()); await key("ArrowLeft"); console.log("←", await state()); await key("ArrowLeft"); console.log("←", await state());
await p.click("#dev-phone", { settle: 1200 }); console.log("phone toggle", await state()); await wait(800); await p.screenshot("/tmp/shots/deck-phone-on-desktop.png");
await b.close();
