import chalk from "chalk";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";
import { MANAGER_ORDER } from "../constants.js";
import { checkOutdated } from "../outdated.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start a temporary dashboard server and open it in the browser.
 * Returns a cleanup function to shut down the server.
 */
export async function startDashboard(
  packages,
  managers,
  { outdated = false } = {},
) {
  const templatePath = join(__dirname, "template.html");
  let html = await readFile(templatePath, "utf-8");

  const payload = JSON.stringify({
    packages,
    managers: managers.map((m) => ({ name: m.name, version: m.version })),
    managerOrder: MANAGER_ORDER,
    generatedAt: new Date().toISOString(),
    outdatedPreloaded: outdated,
  });

  // Escape for embedding inside a double-quoted JS string (avoid breaking JSON.parse("..."))
  const escapedPayload = payload
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  html = html.replace("__GLOBOX_DATA__", escapedPayload);

  let outdatedCache = null;

  const server = createServer(async (req, res) => {
    if (req.url === "/api/outdated") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });

      try {
        if (!outdatedCache) {
          outdatedCache = await checkOutdated(packages);
        }
        res.end(JSON.stringify(outdatedCache));
      } catch (err) {
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", async () => {
      const { port } = server.address();
      const url = `http://127.0.0.1:${port}`;

      console.log(
        chalk.cyan(`\n  Dashboard running at ${chalk.bold.underline(url)}`),
      );
      console.log(chalk.gray("  Press Ctrl+C to stop and clean up\n"));

      await open(url);

      const cleanup = () => {
        server.close();
        console.log(chalk.gray("\n  Dashboard stopped.\n"));
      };

      process.on("SIGINT", () => {
        cleanup();
        process.exit(0);
      });

      process.on("SIGTERM", () => {
        cleanup();
        process.exit(0);
      });

      resolve(cleanup);
    });
  });
}
