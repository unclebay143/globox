import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import chalk from "chalk";

/**
 * Export packages list to a JSON or CSV file.
 */
export async function exportPackages(packages, filePath) {
  const resolved = resolve(filePath);
  const ext = resolved.split(".").pop()?.toLowerCase();

  let content;

  if (ext === "csv") {
    content = toCSV(packages);
  } else {
    content = JSON.stringify(packages, null, 2);
  }

  await writeFile(resolved, content, "utf-8");
  console.log(
    chalk.green(
      `\n  Exported ${packages.length} packages to ${chalk.bold(resolved)}\n`
    )
  );
}

function toCSV(packages) {
  const header = "Package,Version,Manager";
  const rows = packages.map(
    (p) => `"${p.name}","${p.version}","${p.manager}"`
  );
  return [header, ...rows].join("\n");
}
