import { execa } from "execa";
import { isYarnClassic } from "./detect.js";
import { MANAGER_ORDER } from "./constants.js";

/**
 * List globally installed packages for a given manager.
 * Returns an array of { name, version, manager }.
 */
export async function listPackages(manager) {
  switch (manager.name) {
    case "npm":
      return listNpm();
    case "pnpm":
      return listPnpm();
    case "yarn":
      return listYarn(manager);
    default:
      return [];
  }
}

/**
 * List all global packages across all detected managers.
 */
export async function listAllPackages(managers) {
  const results = await Promise.allSettled(
    managers.map((m) => listPackages(m))
  );

  const packages = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      packages.push(...result.value);
    }
  }

  return packages.sort((a, b) => {
    const managerDiff =
      (MANAGER_ORDER[a.manager] ?? 99) - (MANAGER_ORDER[b.manager] ?? 99);
    if (managerDiff !== 0) return managerDiff;
    return a.name.localeCompare(b.name);
  });
}

async function listNpm() {
  try {
    const { stdout } = await execa("npm", [
      "list",
      "-g",
      "--depth=0",
      "--json",
    ]);
    const data = JSON.parse(stdout);
    const deps = data.dependencies || {};
    return Object.entries(deps).map(([name, info]) => ({
      name,
      version: info.version || "unknown",
      manager: "npm",
    }));
  } catch {
    return [];
  }
}

async function listPnpm() {
  try {
    const { stdout } = await execa("pnpm", [
      "list",
      "-g",
      "--depth=0",
      "--json",
    ]);
    const data = JSON.parse(stdout);
    const list = Array.isArray(data) ? data[0] : data;
    const deps = list?.dependencies || {};
    return Object.entries(deps).map(([name, info]) => ({
      name,
      version: info.version || "unknown",
      manager: "pnpm",
    }));
  } catch {
    return [];
  }
}

async function listYarn(manager) {
  if (!isYarnClassic(manager)) {
    return [];
  }

  try {
    const { stdout } = await execa("yarn", ["global", "list", "--json"]);
    const packages = [];
    const lines = stdout.trim().split("\n");

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.type === "info" && json.data) {
          const match = json.data.match(/"(.+)@(.+)"/);
          if (match) {
            packages.push({
              name: match[1],
              version: match[2],
              manager: "yarn",
            });
          }
        }
      } catch {
        // Some lines from yarn aren't valid JSON — skip
        const match = line.match(/info "(.+)@(.+)" has binaries/);
        if (match) {
          packages.push({
            name: match[1],
            version: match[2],
            manager: "yarn",
          });
        }
      }
    }

    return packages;
  } catch {
    return [];
  }
}
