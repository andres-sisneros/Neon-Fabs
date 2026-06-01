const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const host = "127.0.0.1";
const port = 8765;
const url = `http://${host}:${port}/index.html`;

function canReachServer() {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await canReachServer()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function spawnServer() {
  return spawn(process.execPath, [path.join("scripts", "static-server.js")], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, HOST: host, PORT: String(port) },
    stdio: ["ignore", "ignore", "inherit"],
    windowsHide: true,
  });
}

function stopServer(server) {
  if (!server || server.killed) return;
  server.kill("SIGTERM");
}

async function main() {
  let server = null;
  if (!await canReachServer()) {
    server = spawnServer();
    if (!await waitForServer()) {
      stopServer(server);
      console.error(`Could not start test server at ${url}`);
      process.exit(1);
    }
  }

  const playwrightCli = require.resolve("@playwright/test/cli");
  const runner = spawn(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
    cwd: path.resolve(__dirname, ".."),
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });

  runner.on("exit", (code, signal) => {
    stopServer(server);
    if (signal) {
      console.error(`Playwright exited with signal ${signal}`);
      process.exit(1);
    }
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
