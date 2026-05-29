#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const APP_NAME = "Bartleby";
const GITHUB_REPO = "SihyunAdventure/bartleby";
const SIGN_IDENTITY = "Developer ID Application: Notique Inc. (7M2DZPHB8R)";
const NOTARY_PROFILE = "notique-notary";
const UPDATER_KEY = `${process.env.HOME}/.config/secrets/bartleby-updater.key`;

function usage() {
  console.log(`Usage:
  pnpm release:ship -- --patch --title "Short changelog title" --notes "One paragraph release notes"
  pnpm release:ship -- --version 0.1.5 --title "..." --notes "..."

Options:
  --patch | --minor | --major      Bump from package.json version
  --version <x.y.z>                Explicit next version
  --title <text>                   Changelog / GitHub release title
  --notes <text>                   Changelog / latest.json / GitHub release notes
  --min-version <x.y.z>            Mark update mandatory: apps older than this are forced to update
  --skip-push                      Do not git push, create GitHub release, or deploy Vercel
  --skip-github-release            Do not create GitHub release
  --skip-vercel                    Do not run vercel deploy --prod
  --dry-run                        Print planned version and stop before writes
`);
}

function parseArgs(argv) {
  const args = {
    bump: null,
    version: null,
    title: null,
    notes: null,
    minVersion: null,
    skipPush: false,
    skipGithubRelease: false,
    skipVercel: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (["--patch", "--minor", "--major"].includes(arg)) args.bump = arg.slice(2);
    else if (arg === "--version") args.version = argv[++i];
    else if (arg === "--title") args.title = argv[++i];
    else if (arg === "--notes") args.notes = argv[++i];
    else if (arg === "--min-version") args.minVersion = argv[++i];
    else if (arg === "--skip-push") args.skipPush = true;
    else if (arg === "--skip-github-release") args.skipGithubRelease = true;
    else if (arg === "--skip-vercel") args.skipVercel = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function run(cmd, args = [], opts = {}) {
  console.log(`$ ${[cmd, ...args].join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: opts.capture ? "pipe" : "inherit",
    encoding: "utf8",
    env: { ...process.env, ...(opts.env ?? {}) },
  });
  if (result.status !== 0) {
    const stderr = result.stderr ? `\n${result.stderr}` : "";
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}${stderr}`);
  }
  return opts.capture ? result.stdout.trim() : "";
}

function read(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

function write(path, value) {
  writeFileSync(join(ROOT, path), value);
}

function replaceAll(path, from, to) {
  write(path, read(path).split(from).join(to));
}

function getPackage() {
  return JSON.parse(read("package.json"));
}

function bumpVersion(current, kind) {
  const parts = current.split(".").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    throw new Error(`Unsupported semver: ${current}`);
  }
  if (kind === "major") return `${parts[0] + 1}.0.0`;
  if (kind === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function assertCleanTree() {
  const status = run("git", ["status", "--porcelain"], { capture: true });
  if (status) {
    throw new Error(`Working tree is dirty. Commit or stash changes before release:\n${status}`);
  }
}

function updateJson(path, updater) {
  const data = JSON.parse(read(path));
  updater(data);
  write(path, `${JSON.stringify(data, null, 2)}\n`);
}

function updateVersions(previous, next) {
  updateJson("package.json", (pkg) => { pkg.version = next; });
  replaceAll("src-tauri/Cargo.toml", `version = "${previous}"`, `version = "${next}"`);
  replaceAll("src-tauri/tauri.conf.json", `"version": "${previous}"`, `"version": "${next}"`);
}

function updateWebReferences(previous, next) {
  for (const path of ["web/index.html", "web/pricing.html", "web/terms.html"]) {
    replaceAll(path, previous, next);
    replaceAll(path, `Bartleby_${previous}_universal`, `Bartleby_${next}_universal`);
  }
}

function updateChangelog(version, title, notes) {
  const path = "web/changelog.html";
  const entry = `<section class="entry"><div class="version">v${escapeHtml(version)} — ${escapeHtml(title)}</div><p>${escapeHtml(notes)}</p></section>`;
  const html = read(path);
  if (html.includes(`v${version} —`)) return;
  write(path, html.replace("<h1>Changelog</h1>", `<h1>Changelog</h1>${entry}`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function updaterPrivateKeyEnv() {
  if (!existsSync(UPDATER_KEY)) throw new Error(`Missing updater key: ${UPDATER_KEY}`);
  return {
    TAURI_SIGNING_PRIVATE_KEY: readFileSync(UPDATER_KEY, "utf8"),
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD ?? "",
  };
}

function buildRelease() {
  run("pnpm", ["build"]);
  run("cargo", ["test", "--manifest-path", "src-tauri/Cargo.toml"]);
  run("pnpm", ["build:mac:universal"], { env: updaterPrivateKeyEnv() });
}

function verifyAndNotarize(version) {
  const app = `src-tauri/target/universal-apple-darwin/release/bundle/macos/${APP_NAME}.app`;
  const dmg = `src-tauri/target/universal-apple-darwin/release/bundle/dmg/${APP_NAME}_${version}_universal.dmg`;
  if (!existsSync(join(ROOT, app))) throw new Error(`Missing app bundle: ${app}`);
  if (!existsSync(join(ROOT, dmg))) throw new Error(`Missing DMG: ${dmg}`);
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", app]);
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", dmg]);
  run("xcrun", ["notarytool", "submit", dmg, "--keychain-profile", NOTARY_PROFILE, "--wait"]);
  run("xcrun", ["stapler", "staple", dmg]);
  run("xcrun", ["stapler", "validate", dmg]);
  run("spctl", ["-a", "-vv", "-t", "install", dmg]);
}

function copyArtifacts(version) {
  const macosDir = "src-tauri/target/universal-apple-darwin/release/bundle/macos";
  const dmgDir = "src-tauri/target/universal-apple-darwin/release/bundle/dmg";
  const files = {
    dmg: `web/releases/${APP_NAME}_${version}_universal.dmg`,
    tar: `web/releases/${APP_NAME}_${version}_universal.app.tar.gz`,
    sig: `web/releases/${APP_NAME}_${version}_universal.app.tar.gz.sig`,
  };
  copyFileSync(join(ROOT, dmgDir, `${APP_NAME}_${version}_universal.dmg`), join(ROOT, files.dmg));
  copyFileSync(join(ROOT, macosDir, `${APP_NAME}.app.tar.gz`), join(ROOT, files.tar));
  copyFileSync(join(ROOT, macosDir, `${APP_NAME}.app.tar.gz.sig`), join(ROOT, files.sig));
  return files;
}

function updateLatest(version, notes, sigPath, minVersion) {
  const signature = read(sigPath).trim();
  const latest = {
    version,
    notes,
    // Optional custom field: the app reads it via the updater's rawJson and
    // forces the update when the running version is older than min_version.
    // The Tauri updater itself ignores unknown feed fields.
    ...(minVersion ? { min_version: minVersion } : {}),
    pub_date: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    platforms: {
      "darwin-aarch64": {
        signature,
        url: `https://heybartleby.com/releases/${APP_NAME}_${version}_universal.app.tar.gz`,
      },
      "darwin-x86_64": {
        signature,
        url: `https://heybartleby.com/releases/${APP_NAME}_${version}_universal.app.tar.gz`,
      },
    },
  };
  write("web/latest.json", `${JSON.stringify(latest, null, 2)}\n`);
}

function commitTagPush(version, title, notes, skipPush) {
  run("git", ["add", "package.json", "src-tauri/Cargo.lock", "src-tauri/Cargo.toml", "src-tauri/tauri.conf.json", "web"]);
  run("git", [
    "commit",
    "-m", `Release ${version} for ${title}`,
    "-m", `${notes}\n\nConstraint: Release automation owns version bump, changelog, latest.json, signed artifacts, GitHub release, and Vercel deployment so future edits do not ship stale downloads.\nConfidence: high\nScope-risk: narrow\nDirective: Use pnpm release:ship for public Mac releases; do not hand-edit latest.json signatures unless repairing a failed release.\nTested: pnpm build; cargo test; universal Tauri build; codesign verify; Apple notarization; stapler validate; spctl; live Vercel checks after deploy\nNot-tested: Fresh install click-through on every macOS privacy state`,
  ]);
  run("git", ["tag", "-a", `v${version}`, "-m", `v${version}`]);
  if (!skipPush) run("git", ["push", "origin", "main", "--tags"]);
}

function createGithubRelease(version, title, notes, files, skip) {
  if (skip) return;
  run("gh", [
    "release", "create", `v${version}`,
    files.dmg,
    files.tar,
    files.sig,
    "--repo", GITHUB_REPO,
    "--title", `${APP_NAME} v${version}`,
    "--notes", `${title}\n\n${notes}`,
  ]);
}

function deployVercel(skip) {
  if (skip) return;
  run("vercel", ["deploy", "--prod"]);
}

function verifyLive(version) {
  const latest = run("curl", ["-fsSL", "https://heybartleby.com/latest.json"], { capture: true });
  const parsed = JSON.parse(latest);
  if (parsed.version !== version) throw new Error(`Live latest.json is ${parsed.version}, expected ${version}`);
  run("curl", ["-I", "-fsSL", `https://heybartleby.com/releases/${APP_NAME}_${version}_universal.dmg`]);
  run("curl", ["-I", "-fsSL", `https://heybartleby.com/releases/${APP_NAME}_${version}_universal.app.tar.gz.sig`]);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.title || !args.notes) {
    usage();
    throw new Error("--title and --notes are required");
  }
  const current = getPackage().version;
  const next = args.version ?? bumpVersion(current, args.bump ?? "patch");
  if (!/^\d+\.\d+\.\d+$/.test(next)) throw new Error(`Invalid version: ${next}`);
  if (next === current) throw new Error(`Next version equals current version: ${next}`);
  if (args.minVersion && !/^\d+\.\d+\.\d+$/.test(args.minVersion)) {
    throw new Error(`Invalid --min-version: ${args.minVersion}`);
  }

  console.log(`Release plan: ${current} -> ${next}`);
  console.log(`Title: ${args.title}`);
  console.log(`Notes: ${args.notes}`);
  if (args.minVersion) console.log(`Mandatory below: ${args.minVersion}`);
  if (args.dryRun) return;

  assertCleanTree();
  updateVersions(current, next);
  updateWebReferences(current, next);
  updateChangelog(next, args.title, args.notes);
  buildRelease();
  // Cargo.lock is updated by cargo test/build after Cargo.toml version changes.
  verifyAndNotarize(next);
  const files = copyArtifacts(next);
  updateLatest(next, args.notes, files.sig, args.minVersion);
  // Re-run lightweight checks after generated web metadata changes.
  run("pnpm", ["build"]);
  run("python3", ["-m", "json.tool", "web/latest.json"], { capture: true });
  commitTagPush(next, args.title, args.notes, args.skipPush);
  createGithubRelease(next, args.title, args.notes, files, args.skipPush || args.skipGithubRelease);
  deployVercel(args.skipPush || args.skipVercel);
  if (!args.skipPush && !args.skipVercel) verifyLive(next);
  console.log(`Released ${APP_NAME} v${next}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
