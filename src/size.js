import { execa } from "execa";
import { stat, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Get the global node_modules root path for a package manager.
 */
async function getGlobalRoot(managerName) {
  try {
    switch (managerName) {
      case "npm": {
        const { stdout } = await execa("npm", ["root", "-g"]);
        return stdout.trim();
      }
      case "pnpm": {
        const { stdout } = await execa("pnpm", ["root", "-g"]);
        return stdout.trim();
      }
      case "yarn": {
        const { stdout } = await execa("yarn", ["global", "dir"]);
        return join(stdout.trim(), "node_modules");
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Recursively calculate the total size of a directory in bytes.
 */
async function dirSize(dirPath) {
  let total = 0;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const sizes = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          return dirSize(fullPath);
        }
        if (entry.isFile()) {
          const s = await stat(fullPath);
          return s.size;
        }
        return 0;
      })
    );
    total = sizes.reduce((sum, s) => sum + s, 0);
  } catch {
    // Permission denied or missing — skip
  }

  return total;
}

/**
 * Format bytes into a human-readable string.
 */
export function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Enrich packages with their disk size.
 * Returns a new array with a `size` (bytes) and `sizeFormatted` field on each package.
 */
export async function enrichWithSizes(packages, { onProgress } = {}) {
  const rootCache = new Map();

  async function getRoot(managerName) {
    if (!rootCache.has(managerName)) {
      rootCache.set(managerName, await getGlobalRoot(managerName));
    }
    return rootCache.get(managerName);
  }

  const enriched = [];

  const BATCH_SIZE = 8;
  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (pkg) => {
        const root = await getRoot(pkg.manager);
        let size = 0;
        if (root) {
          const pkgDir = join(root, pkg.name);
          size = await dirSize(pkgDir);
        }
        return { ...pkg, size, sizeFormatted: formatSize(size) };
      })
    );
    enriched.push(...results);
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, packages.length), packages.length);
    }
  }

  return enriched;
}
