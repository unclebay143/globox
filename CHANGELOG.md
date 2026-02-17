# Changelog

## v3.0.0 (Upcoming)

### New Features

- `globox scan` — discover all Node.js projects on your machine and show which package manager each uses
- Per-project `node_modules` disk usage breakdown
- System-wide view of your entire Node.js footprint across all projects
- Dashboard view for scan results with sortable project list

---

## v2.0.0 (Upcoming)

### New Features

- `globox rm` — interactive multi-select to uninstall global packages from any manager
- Dashboard delete button per row with confirmation dialog
- `globox update` — interactive update of outdated global packages
- `globox sync` — migrate global packages from one manager to another

---

## v1.0.0 (2026.2.17)

### Features

- List all globally installed packages across npm, pnpm, and yarn with a single command
- Auto-detect which package managers are installed (skip missing ones gracefully)
- Group packages by manager (npm first, then pnpm, then yarn)
- `--size` / `-s` — show disk size of each package
- `--sort <field>` — sort by `name` (default) or `size`
- `--outdated` / `-o` — check which packages have newer versions available
- `--doctor` — detect duplicate packages installed across multiple managers
- `--export <path>` / `-e` — export package list to JSON or CSV
- `--dashboard` / `-d` — launch an interactive web dashboard in the browser
- `--json` / `-j` — output raw JSON for scripting and piping
- `--manager <names>` / `-m` — filter by specific package managers

### Dashboard

- Search and filter packages in real-time
- Filter by package manager with toggle buttons
- Sortable columns (Package, Size, Manager) with click-to-sort
- "Check for updates" button with lazy fetch (no upfront latency)
- Pre-load outdated data with `globox -d -o`
- Stats cards showing total packages, total disk size, and per-manager counts
- Dark theme, responsive design
- Auto-opens in browser, shuts down cleanly on Ctrl+C
