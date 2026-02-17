import Table from "cli-table3";
import chalk from "chalk";
import { formatSize } from "./size.js";

const MANAGER_COLORS = {
  npm: chalk.red,
  pnpm: chalk.hex("#F9AD00"),
  yarn: chalk.blue,
};

/**
 * Print a formatted table of packages to stdout.
 */
export function printTable(packages, { showSize = false } = {}) {
  if (packages.length === 0) {
    console.log(chalk.yellow("\n  No global packages found.\n"));
    return;
  }

  const head = [
    chalk.bold("Package"),
    chalk.bold("Version"),
  ];
  if (showSize) head.push(chalk.bold("Size"));
  head.push(chalk.bold("Manager"));

  const colWidths = showSize ? [30, 14, 12, 10] : [35, 15, 10];

  const table = new Table({
    head,
    style: {
      head: [],
      border: ["gray"],
    },
    colWidths,
  });

  for (const pkg of packages) {
    const colorFn = MANAGER_COLORS[pkg.manager] || chalk.white;
    const row = [pkg.name, pkg.version];
    if (showSize) row.push(chalk.cyan(pkg.sizeFormatted || "—"));
    row.push(colorFn(pkg.manager));
    table.push(row);
  }

  console.log(table.toString());

  let summary = `Found ${chalk.white.bold(packages.length)} global package${packages.length !== 1 ? "s" : ""} across ${chalk.white.bold(countManagers(packages))} manager${countManagers(packages) !== 1 ? "s" : ""}`;

  if (showSize) {
    const totalBytes = packages.reduce((sum, p) => sum + (p.size || 0), 0);
    summary += ` — total size: ${chalk.cyan.bold(formatSize(totalBytes))}`;
  }

  console.log(chalk.gray(`\n  ${summary}\n`));
}

/**
 * Print the outdated table with Current and Latest columns.
 */
export function printOutdatedTable(packages) {
  const outdated = packages.filter((p) => p.latest && p.version !== p.latest);

  if (outdated.length === 0) {
    console.log(chalk.green("\n  All global packages are up to date!\n"));
    return;
  }

  const table = new Table({
    head: [
      chalk.bold("Package"),
      chalk.bold("Current"),
      chalk.bold("Latest"),
      chalk.bold("Manager"),
    ],
    style: {
      head: [],
      border: ["gray"],
    },
  });

  for (const pkg of outdated) {
    const colorFn = MANAGER_COLORS[pkg.manager] || chalk.white;
    table.push([
      pkg.name,
      chalk.red(pkg.version),
      chalk.green(pkg.latest),
      colorFn(pkg.manager),
    ]);
  }

  console.log(table.toString());
  console.log(
    chalk.yellow(
      `\n  ${outdated.length} outdated package${outdated.length !== 1 ? "s" : ""}\n`
    )
  );
}

function countManagers(packages) {
  return new Set(packages.map((p) => p.manager)).size;
}
