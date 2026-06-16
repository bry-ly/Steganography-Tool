#!/usr/bin/env node
/**
 * Mirrors the root CHANGELOG.md into per-release MDX files under
 * content/docs/changelog/, one file per released version.
 *
 * Convention in CHANGELOG.md:
 *   ## [Unreleased]                  -> ignored
 *   ## [0.1.0] - 2026-06-16          -> content/docs/changelog/2026-06-16-0.1.0.mdx
 *   ## [1.2.3] - 2025-12-01          -> content/docs/changelog/2025-12-01-1.2.3.mdx
 *
 * Run via: pnpm sync-changelog
 */

import { readFile, readdir, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = join(ROOT, "CHANGELOG.md");
const TARGET_DIR = join(ROOT, "content", "docs", "changelog");

const RELEASE_HEADING = /^## \[(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]\s+-\s+(\d{4}-\d{2}-\d{2})\s*$/;

function slugify(version, date) {
  return `${date}-${version}`.replace(/\./g, "-");
}

function frontmatter(version, date) {
  return [
    "---",
    `title: "${version}"`,
    `description: "Release notes for StegnoHide ${version} (${date})."`,
    `icon: Package`,
    "---",
    "",
  ].join("\n");
}

function isGeneratedFile(name) {
  // Skip index.mdx and any non-.mdx files
  return name.endsWith(".mdx") && name !== "index.mdx";
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`[sync-changelog] ${SOURCE} not found`);
    process.exit(1);
  }
  if (!existsSync(TARGET_DIR)) {
    console.error(`[sync-changelog] ${TARGET_DIR} not found`);
    process.exit(1);
  }

  const raw = await readFile(SOURCE, "utf8");
  const lines = raw.split(/\r?\n/);

  // Slice the file into release blocks.
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(RELEASE_HEADING);
    if (m) {
      if (current) blocks.push(current);
      current = { version: m[1], date: m[2], body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) blocks.push(current);

  // Determine which files we will write so we can delete stale ones.
  const desired = new Set();
  let written = 0;
  for (const block of blocks) {
    const slug = slugify(block.version, block.date);
    desired.add(`${slug}.mdx`);
    const body = block.body.join("\n").trim();
    const file = frontmatter(block.version, block.date) + `# ${block.version} (${block.date})\n\n` + body + "\n";
    await writeFile(join(TARGET_DIR, `${slug}.mdx`), file, "utf8");
    written++;
  }

  // Remove generated files that no longer correspond to a release.
  const existing = await readdir(TARGET_DIR);
  let removed = 0;
  for (const name of existing) {
    if (!isGeneratedFile(name)) continue;
    if (desired.has(name)) continue;
    await unlink(join(TARGET_DIR, name));
    removed++;
  }

  console.log(`[sync-changelog] wrote ${written} release page(s), removed ${removed} stale page(s).`);
}

main().catch((err) => {
  console.error("[sync-changelog] failed:", err);
  process.exit(1);
});
