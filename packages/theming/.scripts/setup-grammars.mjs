import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { get } from "node:https";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import report from "./report.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LIB_DIR = join(ROOT, ".lib");

const require = createRequire(import.meta.url);
const pkg = require(join(ROOT, "package.json"));
const grammars = pkg.treeSitterGrammars;

if (!grammars) {
  report.error('No "treeSitterGrammars" configuration found in package.json.');
  process.exit(1);
}

/**
 * Maps Node.js platform/arch to Rust target triple and library extension.
 */
const PLATFORM_MAP = {
  "darwin-arm64": { target: "aarch64-apple-darwin", ext: "so" },
  "darwin-x64": { target: "x86_64-apple-darwin", ext: "so" },
  "linux-x64": { target: "x86_64-unknown-linux-gnu", ext: "so" },
  "win32-x64": { target: "x86_64-pc-windows-msvc", ext: "dll" },
};

const platformKey = `${process.platform}-${process.arch}`;
const platform = PLATFORM_MAP[platformKey];

if (!platform) {
  report.error(
    `Unsupported platform: ${platformKey}. Supported: ${Object.keys(PLATFORM_MAP).join(", ")}`,
  );
  process.exit(1);
}

const force = process.argv.includes("--force");

/**
 * Downloads a file from a URL, following redirects (GitHub Releases redirect to S3).
 * @param {string} url
 * @param {string} destPath
 * @returns {Promise<void>}
 */
function download(url, destPath) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      // Follow redirects (301, 302, 307, 308)
      if (
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        res.resume(); // drain the response to free the socket
        download(res.headers.location, destPath).then(resolve, reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      const file = createWriteStream(destPath);
      res.pipe(file);
      file.on("close", resolve);
      file.on("error", reject);
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function setup() {
  mkdirSync(LIB_DIR, { recursive: true });

  const entries = Object.entries(grammars);

  for (const [repo, version] of entries) {
    // Extract the grammar name from the repo name (e.g., "tree-sitter-scss" -> "scss")
    const name = repo.replace("tree-sitter-", "");
    const artifactName = `${name}-${platform.target}.${platform.ext}`;
    const outputName = `${name}.${platform.ext}`;
    const outputPath = join(LIB_DIR, outputName);

    if (!force && existsSync(outputPath)) {
      report.info(
        `${outputName} already exists, skipping. Use --force to re-download.`,
      );
      continue;
    }

    const url = `https://github.com/simeonoff/${repo}/releases/download/${version}/${artifactName}`;
    report.log(
      `Downloading ${outputName} (${platform.target}) from ${repo}@${version}...`,
    );

    try {
      await download(url, outputPath);
      report.success(`Saved ${outputPath}`);
    } catch (err) {
      report.error(
        `Failed to download ${artifactName}: ${err.message}\n` +
          `URL: ${url}\n` +
          `Make sure the release ${version} exists and has the artifact for ${platform.target}.`,
      );
      process.exit(1);
    }
  }

  report.success("All grammars are ready.");
}

setup();
