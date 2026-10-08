import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname } from "node:path";

const root = resolve("out");
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer from 1 to 65535.");
try { await stat(resolve(root, "index.html")); }
catch { throw new Error("Build the website with npm run build before running npm start."); }
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let target = resolve(root, "." + pathname);
    const within = relative(root, target);
    if (within.startsWith("..") || isAbsolute(within)) { response.writeHead(403); response.end("Forbidden"); return; }
    if ((await stat(target)).isDirectory()) target = resolve(target, "index.html");
    const data = await readFile(target);
    response.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream" });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(await readFile(resolve(root, "404.html")).catch(() => "Not found"));
  }
});
server.on("error", error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, "127.0.0.1", () => console.log(`CodeForge Lab is ready at http://localhost:${port}`));
