import { launch } from "./cdp.mjs";
const b = await launch({ port: 9471, width: 1440, height: 900 }); const p = await b.newPage();
await p.goto("http://localhost:4000/onetake/?t=36", { settle: 2500 });
console.log(await p.eval(`JSON.stringify([...document.querySelectorAll('#viewbox img')].map(i=>({cls:i.className, src:i.src.slice(-26), c:i.complete, w:i.naturalWidth, op:getComputedStyle(i).opacity, vb:getComputedStyle(i.parentNode).height})))`));
await b.close();
