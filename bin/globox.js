#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import {
  detectManagers,
  listAllPackages,
  printTable,
  printOutdatedTable,
  checkOutdated,
  findDuplicates,
  printDuplicates,
  exportPackages,
  enrichWithSizes,
  startDashboard,
} from "../src/index.js";

const program = new Command();

program
  .name("globox")
  .description(
    "One command to list all globally installed npm, pnpm, and yarn packages."
  )
  .version("1.0.0", "-v, --version")
  .option("-d, --dashboard", "Open an interactive dashboard in the browser")
  .option(
    "-m, --manager <managers>",
    "Filter by package manager (comma-separated: npm,pnpm,yarn)"
  )
  .option("-j, --json", "Output as JSON")
  .option("-o, --outdated", "Show only outdated packages")
  .option("--doctor", "Detect duplicate packages across managers")
  .option("-e, --export <path>", "Export package list to a JSON or CSV file")
  .option("-s, --size", "Show disk size of each package")
  .option("--sort <field>", "Sort by: name (default) or size", "name")
  .option("--no-color", "Disable colored output")
  .showHelpAfterError(true)
  .allowExcessArguments(false);

program.on("command:*", ([cmd]) => {
  console.error(chalk.red(`\n  Unknown command: ${cmd}\n`));
  console.error(`  Run ${chalk.bold("globox --help")} to see available options.\n`);
  process.exit(1);
});

program.parse();

const opts = program.opts();

async function fetchOutdated(pkgs) {
  const spinner = ora("Checking for updates...").start();
  const enriched = await checkOutdated(pkgs, {
    onProgress: (done, total) => {
      spinner.text = `Checking for updates... (${done}/${total})`;
    },
  });
  spinner.succeed("Version check complete");
  return enriched;
}

async function main() {
  const filter = opts.manager
    ? opts.manager.split(",").map((m) => m.trim().toLowerCase())
    : null;

  // Detect managers
  const detectSpinner = ora("Detecting package managers...").start();
  const managers = await detectManagers(filter);

  if (managers.length === 0) {
    detectSpinner.fail("No package managers found.");
    if (filter) {
      console.log(
        chalk.yellow(
          `\n  None of the specified managers (${filter.join(", ")}) are installed.\n`
        )
      );
    }
    process.exit(1);
  }

  detectSpinner.succeed(
    `Found ${managers.map((m) => `${chalk.bold(m.name)} v${m.version}`).join(", ")}`
  );

  // List packages
  const listSpinner = ora("Scanning global packages...").start();
  const packages = await listAllPackages(managers);
  listSpinner.succeed(`Found ${chalk.bold(packages.length)} global packages`);

  if (packages.length === 0) {
    console.log(
      chalk.yellow("\n  No globally installed packages found.\n")
    );
    process.exit(0);
  }

  // Enrich with disk sizes if requested, dashboard, or sorting by size
  const needsSize = opts.size || opts.dashboard || opts.sort === "size";
  let pkgs = packages;
  if (needsSize) {
    const sizeSpinner = ora("Calculating package sizes...").start();
    pkgs = await enrichWithSizes(packages, {
      onProgress: (done, total) => {
        sizeSpinner.text = `Calculating package sizes... (${done}/${total})`;
      },
    });
    sizeSpinner.succeed("Size calculation complete");
  }

  // Apply sort
  if (opts.sort === "size") {
    pkgs = [...pkgs].sort((a, b) => (b.size || 0) - (a.size || 0));
  }

  // JSON output
  if (opts.json) {
    console.log(JSON.stringify(pkgs, null, 2));
    return;
  }

  // Dashboard
  if (opts.dashboard) {
    const dashPkgs = opts.outdated ? await fetchOutdated(pkgs) : pkgs;
    await startDashboard(dashPkgs, managers, { outdated: opts.outdated });
    return;
  }

  // Doctor mode
  if (opts.doctor) {
    const duplicates = findDuplicates(pkgs);
    printDuplicates(duplicates);
    return;
  }

  // Outdated mode
  if (opts.outdated) {
    printOutdatedTable(await fetchOutdated(pkgs));
    return;
  }

  // Export
  if (opts.export) {
    await exportPackages(pkgs, opts.export);
    return;
  }

  // Default: print table
  printTable(pkgs, { showSize: opts.size || opts.sort === "size" });
}

main().catch((err) => {
  console.error(chalk.red(`\n  Error: ${err.message}\n`));
  process.exit(1);
});
