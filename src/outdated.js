import { execa } from "execa";

/**
 * Fetch the latest version from the npm registry for a given package.
 */
async function fetchLatest(packageName) {
  try {
    const { stdout } = await execa("npm", ["view", packageName, "version"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Enrich a list of packages with their latest version from the registry.
 * Works in batches to avoid hammering the registry.
 */
export async function checkOutdated(packages, { onProgress } = {}) {
  const BATCH_SIZE = 10;
  const enriched = [];

  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (pkg) => {
        const latest = await fetchLatest(pkg.name);
        return { ...pkg, latest: latest || pkg.version };
      })
    );
    enriched.push(...results);
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, packages.length), packages.length);
    }
  }

  return enriched;
}
