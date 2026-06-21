#!/usr/bin/env node
/**
 * bundle-migration.mjs
 * --------------------
 * Produce a portable tar.gz bundle of the WindowMan Truth Engine repository
 * suitable for handoff to a Cursor-managed clone. Pure Node — no external
 * dependencies. Works on Windows, macOS, and Linux.
 *
 * Usage:   node scripts/bundle-migration.mjs
 * Output:  ./migration-output/windowman-migration-<timestamp>.tar.gz
 *
 * Safety:
 *   - Excludes node_modules, dist, .git, .env, .env.local, .env.*.local,
 *     logs, caches, coverage, and the migration-output/ directory itself.
 *   - Keeps .env.example.
 *   - Fails fast if required top-level directories are missing.
 */

import { createWriteStream, statSync, readdirSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { createGzip } from 'node:zlib';
import { resolve, join, relative, sep, posix } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const ROOT = resolve(process.cwd());
const OUT_DIR = resolve(ROOT, 'migration-output');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_FILE = join(OUT_DIR, `windowman-migration-${STAMP}.tar.gz`);

const REQUIRED_DIRS = ['src', 'public', 'supabase', 'scripts'];
const REQUIRED_FILES = ['package.json', 'vite.config.ts', 'index.html', '.env.example'];

// Patterns excluded everywhere.
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', 'dist-ssr', '.git', '.next', '.turbo', '.cache',
  '.vite', '.parcel-cache', 'coverage', '.nyc_output', 'migration-output',
  '.DS_Store', '.idea', '.vscode', 'playwright-report', 'test-results',
]);
const EXCLUDE_FILE_RX = [
  /^\.env$/, /^\.env\.local$/, /^\.env\..*\.local$/,
  /\.log$/, /\.tmp$/, /\.swp$/, /^\.DS_Store$/,
];
const KEEP_FILES = new Set(['.env.example', '.gitignore', '.gitkeep']);

const included = [];
const excluded = [];

function shouldSkipDir(name) {
  return EXCLUDE_DIRS.has(name);
}
function shouldSkipFile(name) {
  if (KEEP_FILES.has(name)) return false;
  return EXCLUDE_FILE_RX.some((rx) => rx.test(name));
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    const rel = relative(ROOT, abs).split(sep).join(posix.sep);
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) { excluded.push(rel + '/'); continue; }
      yield* walk(abs);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      if (shouldSkipFile(entry.name)) { excluded.push(rel); continue; }
      yield { abs, rel };
    }
  }
}

// ── Minimal POSIX-ustar tar writer ──────────────────────────────────────────
function octal(n, width) { return n.toString(8).padStart(width - 1, '0') + '\0'; }
function makeTarHeader(name, size, mtime) {
  const buf = Buffer.alloc(512, 0);
  if (Buffer.byteLength(name) > 100) throw new Error(`path too long for ustar: ${name}`);
  buf.write(name, 0, 100, 'utf8');
  buf.write(octal(0o644, 8), 100);              // mode
  buf.write(octal(0, 8), 108);                  // uid
  buf.write(octal(0, 8), 116);                  // gid
  buf.write(octal(size, 12), 124);              // size
  buf.write(octal(Math.floor(mtime / 1000), 12), 136); // mtime
  buf.write('        ', 148, 8, 'utf8');        // checksum placeholder
  buf.write('0', 156);                          // typeflag (regular)
  buf.write('ustar\0', 257, 6, 'utf8');         // magic
  buf.write('00', 263, 2, 'utf8');              // version
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += buf[i];
  buf.write(octal(sum, 8), 148);
  return buf;
}
function pad512(size) {
  const r = size % 512;
  return r === 0 ? 0 : 512 - r;
}

async function main() {
  console.log(`▶ WindowMan migration bundler`);
  console.log(`  Root: ${ROOT}`);

  for (const d of REQUIRED_DIRS) {
    if (!existsSync(join(ROOT, d))) {
      console.error(`✘ Missing required directory: ${d}/`);
      process.exit(1);
    }
  }
  for (const f of REQUIRED_FILES) {
    if (!existsSync(join(ROOT, f))) {
      console.error(`✘ Missing required file: ${f}`);
      if (f === '.env.example') console.error('  Create one from MIGRATION_BLUEPRINT.md §3 before bundling.');
      process.exit(1);
    }
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // Collect file list deterministically.
  const files = [...walk(ROOT)].sort((a, b) => a.rel.localeCompare(b.rel));
  for (const f of files) included.push(f.rel);

  // Stream tar -> gzip -> file.
  async function* tarStream() {
    for (const { abs, rel } of files) {
      const data = readFileSync(abs);
      const st = statSync(abs);
      yield makeTarHeader(rel, data.length, st.mtimeMs);
      yield data;
      const pad = pad512(data.length);
      if (pad) yield Buffer.alloc(pad, 0);
    }
    // Two zero blocks terminate the archive.
    yield Buffer.alloc(1024, 0);
  }

  const gzip = createGzip({ level: 9 });
  await pipeline(Readable.from(tarStream()), gzip, createWriteStream(OUT_FILE));

  const sizeMB = (statSync(OUT_FILE).size / (1024 * 1024)).toFixed(2);
  console.log(`\n✓ Bundle written: ${relative(ROOT, OUT_FILE)} (${sizeMB} MB)`);
  console.log(`  Included files: ${included.length}`);
  console.log(`  Excluded paths: ${excluded.length}`);
  console.log(`\n— Sample excluded paths —`);
  for (const p of excluded.slice(0, 20)) console.log('  • ' + p);
  if (excluded.length > 20) console.log(`  …and ${excluded.length - 20} more`);
  console.log(`\nNext: extract on the target machine, then follow MIGRATION_BLUEPRINT.md §8.`);
}

main().catch((err) => { console.error('✘ Bundle failed:', err); process.exit(1); });
