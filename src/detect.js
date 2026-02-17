import { execa } from "execa";

const MANAGERS = [
  { name: "npm", command: "npm", versionArgs: ["--version"] },
  { name: "pnpm", command: "pnpm", versionArgs: ["--version"] },
  { name: "yarn", command: "yarn", versionArgs: ["--version"] },
];

/**
 * Detect which package managers are installed on the system.
 * Returns an array of { name, version } for each found manager.
 */
export async function detectManagers(filter) {
  const managers = filter
    ? MANAGERS.filter((m) => filter.includes(m.name))
    : MANAGERS;

  const results = await Promise.allSettled(
    managers.map(async (m) => {
      const { stdout } = await execa(m.command, m.versionArgs);
      const version = stdout.trim();
      const major = parseInt(version.split(".")[0], 10);
      return { name: m.name, version, major };
    })
  );

  const detected = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "fulfilled") {
      detected.push(results[i].value);
    }
  }

  return detected;
}

/**
 * Check if yarn is v1 (classic) — yarn global is removed in v2+.
 */
export function isYarnClassic(manager) {
  return manager.name === "yarn" && manager.major < 2;
}
