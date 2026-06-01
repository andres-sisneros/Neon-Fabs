const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8765);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function requestedFile(url = "/") {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(root, safePath === "/" ? "index.html" : safePath);
  return target.startsWith(root) ? target : path.join(root, "index.html");
}

const server = http.createServer((request, response) => {
  const filePath = requestedFile(request.url);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Serving Neon Fabs at http://${host}:${port}/index.html`);
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
});
