# globox

One command to list all globally installed npm, pnpm, and yarn packages — with an optional dashboard.

```diff
- npm list -g --depth=0
- pnpm list -g
- yarn global list
+ globox
```

## Quick Start

```bash
# Install
npm install -g globox

# List all global packages
globox

# Open the interactive dashboard
globox -d
```

That's it. globox auto-detects which package managers you have and aggregates everything into one view.

## Why

Managing global packages across multiple package managers is painful:

- **Three different commands** — `npm list -g`, `pnpm list -g`, `yarn global list` each with different output formats
- **No unified view** — impossible to see everything at a glance without running commands one by one
- **Hidden disk usage** — global packages silently eat gigabytes with no easy way to see which ones are the biggest
- **Duplicates go unnoticed** — the same package installed in both npm and pnpm wastes space and causes confusion
- **Outdated packages pile up** — no single command checks for updates across all managers
- **No export or backup** — switching machines means manually remembering what you had installed

globox fixes all of this with one command that works across npm, pnpm, and yarn.

## Usage

```bash
# List everything (grouped by manager)
globox

# Show disk sizes
globox -s

# Sort by size (biggest first)
globox --sort size

# Filter to one manager
globox -m pnpm

# Check for outdated packages
globox --outdated

# Find duplicates across managers
globox --doctor

# Export to file
globox --export globals.json
globox --export globals.csv

# JSON output (great for piping)
globox --json

# Open the web dashboard
globox -d

# Dashboard with pre-loaded outdated info
globox -d -o
```

## Dashboard

Run `globox -d` to launch a temporary web dashboard:

- Search and filter packages in real-time
- Click column headers to sort by Package, Size, or Manager
- Filter by package manager with toggle buttons
- "Check for updates" button to see outdated packages
- Stats at a glance — total packages, total disk size, per-manager counts
- Auto-opens in your browser, shuts down on Ctrl+C

## How It Works

1. **Detect** — globox checks which package managers are installed (npm, pnpm, yarn)
2. **Scan** — runs each manager's list command in parallel and parses the output
3. **Display** — aggregates results into a formatted table, JSON, or interactive dashboard

Managers that aren't installed are silently skipped. Yarn Berry (v2+) is handled gracefully since `yarn global` was removed.

## Commands

```bash
globox                           # List all global packages
globox -d, --dashboard           # Open interactive web dashboard
globox -m, --manager <names>     # Filter by manager (comma-separated: npm,pnpm,yarn)
globox -s, --size                # Show disk size of each package
globox --sort <field>            # Sort by: name (default) or size
globox -o, --outdated            # Show outdated packages with latest versions
globox --doctor                  # Detect duplicates across managers
globox -e, --export <path>       # Export to JSON or CSV file
globox -j, --json                # Output as JSON
globox --no-color                # Disable colored output
globox -v, --version             # Print version
globox -h, --help                # Show help
```

Flags can be combined:

```bash
globox -s -m npm                 # npm packages with sizes
globox --sort size -m pnpm       # pnpm packages sorted by size
globox -d -o                     # dashboard with pre-loaded outdated info
globox --json --sort size        # JSON output sorted by size
```

## Supported Package Managers

| Manager | Detection | Global List | Notes |
| --- | --- | --- | --- |
| **npm** | `npm --version` | `npm list -g --json` | Full support |
| **pnpm** | `pnpm --version` | `pnpm list -g --json` | Full support |
| **yarn** | `yarn --version` | `yarn global list` | v1 (Classic) only — Yarn Berry removed `yarn global` |

Managers that aren't installed are silently skipped.

## Requirements

- Node.js >= 18

## License

MIT
