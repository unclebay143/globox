import chalk from "chalk";

/**
 * Find packages that are installed globally in more than one package manager.
 */
export function findDuplicates(packages) {
  const map = new Map();

  for (const pkg of packages) {
    if (!map.has(pkg.name)) {
      map.set(pkg.name, []);
    }
    map.get(pkg.name).push(pkg);
  }

  const duplicates = [];
  for (const [name, entries] of map) {
    if (entries.length > 1) {
      duplicates.push({ name, entries });
    }
  }

  return duplicates;
}

/**
 * Print duplicate package warnings.
 */
export function printDuplicates(duplicates) {
  if (duplicates.length === 0) {
    console.log(
      chalk.green("\n  No duplicates found — your globals are clean!\n")
    );
    return;
  }

  console.log("");
  for (const dup of duplicates) {
    const locations = dup.entries
      .map((e) => `${chalk.bold(e.manager)} (${e.version})`)
      .join(", ");
    console.log(`  ${chalk.yellow("⚠")} ${chalk.bold(dup.name)} found in: ${locations}`);
  }

  console.log(
    chalk.yellow(
      `\n  ${duplicates.length} duplicate package${duplicates.length !== 1 ? "s" : ""} detected across managers\n`
    )
  );
}
