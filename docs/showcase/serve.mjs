// Serves the presentation (./deck) on http://localhost:4000 (override with PORT). No dependencies.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(resolve(fileURLToPath(new URL(".", import.meta.url))), "deck");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon" };
createServer((req, res) => {
  let file = join(root, normalize(decodeURIComponent(req.url.split("?")[0])));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT) || 4000, "127.0.0.1", () => console.log("Showcase on http://localhost:" + (process.env.PORT || 4000)));
