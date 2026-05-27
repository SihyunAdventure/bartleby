#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, chmodSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'src-tauri/swift/bartleby-mic.swift');
const outDir = resolve(root, 'src-tauri/binaries');
const tmpDir = resolve(root, 'src-tauri/target/sidecars/bartleby-mic');
const moduleCache = resolve(root, 'src-tauri/target/sidecars/module-cache');

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });
mkdirSync(moduleCache, { recursive: true });

const env = {
  ...process.env,
  CLANG_MODULE_CACHE_PATH: moduleCache,
  MODULE_CACHE_DIR: moduleCache,
};

function run(command, args) {
  const rendered = [command, ...args].join(' ');
  console.log(`[sidecar] ${rendered}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function build(triple, swiftTarget) {
  const out = resolve(outDir, `bartleby-mic-${triple}`);
  const tmp = resolve(tmpDir, `bartleby-mic-${triple}`);
  rmSync(tmp, { force: true });
  run('xcrun', [
    'swiftc',
    source,
    '-O',
    '-target',
    swiftTarget,
    '-o',
    tmp,
  ]);
  copyFileSync(tmp, out);
  chmodSync(out, 0o755);
  return out;
}

const arm64 = build('aarch64-apple-darwin', 'arm64-apple-macosx15.0');
const x86 = build('x86_64-apple-darwin', 'x86_64-apple-macosx15.0');

const universal = resolve(outDir, 'bartleby-mic-universal-apple-darwin');
rmSync(universal, { force: true });
run('xcrun', ['lipo', '-create', arm64, x86, '-output', universal]);
chmodSync(universal, 0o755);

// The release app locates the sidecar by the stable executable name. Tauri's
// externalBin embedding may preserve either the config name or a target suffix
// depending on target/platform, so keep an unsuffixed local copy for dev/test
// and for bundle post-processing fallbacks.
const plain = resolve(outDir, 'bartleby-mic');
copyFileSync(universal, plain);
chmodSync(plain, 0o755);

for (const file of [arm64, x86, universal, plain]) {
  if (!existsSync(file)) throw new Error(`missing sidecar output: ${file}`);
}
console.log('[sidecar] built bartleby-mic sidecars');
