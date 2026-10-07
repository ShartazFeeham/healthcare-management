#!/usr/bin/env node
// Zero-dependency static file server with SPA fallback (index.html for unknown routes).
// usage: node serve-static.js <dir> <port>
const http = require("http");
const fs = require("fs");
const path = require("path");
const [dir = ".", port = 3100] = process.argv.slice(2);
const root = path.resolve(dir);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject", ".map": "application/json", ".mp4": "video/mp4", ".txt": "text/plain",
};
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(root, path.normalize(urlPath));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const index = path.join(file, "index.html");
      file = fs.existsSync(file) && fs.statSync(file).isDirectory() && fs.existsSync(index) ? index : path.join(root, "index.html");
    }
  } catch { file = path.join(root, "index.html"); }
  const stream = fs.createReadStream(file);
  stream.on("error", () => { // e.g. the build folder is being replaced: answer instead of crashing
    if (!res.headersSent) res.writeHead(503, { "Content-Type": "text/plain" });
    res.end("Frontend build is not available yet.");
  });
  stream.on("open", () => {
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    stream.pipe(res);
  });
}).listen(Number(port), "127.0.0.1", () => console.log(`serving ${root} on http://localhost:${port}`));
