/**
 * build-tauri.mjs
 *
 * Custom build script for Tauri static export.
 * Temporarily moves `src/app/api` out of the way so Next.js can produce
 * a clean static export (output: 'export') without hitting conflicts from
 * server-only API routes (which use `force-dynamic` and cannot be statically
 * exported). The Tauri app calls these API routes via the production Vercel
 * deployment (https://usevoicescribe.vercel.app/api/...) at runtime.
 */

import { rename, access } from "fs/promises";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const apiDir = join(root, "src", "app", "api");
const apiDirHidden = join(root, "src", "app", "_api_tauri_backup");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const apiExists = await exists(apiDir);

  // Step 1: Hide API directory from Next.js static export
  if (apiExists) {
    console.log("⏸  Temporarily moving src/app/api → src/app/_api_tauri_backup ...");
    await rename(apiDir, apiDirHidden);
  }

  try {
    // Step 2: Run Next.js static export build
    console.log("🔨 Running Next.js static export build for Tauri ...");
    execSync("npx next build", {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        BUILD_TARGET: "tauri",
      },
    });
    console.log("✅ Next.js static export completed successfully.");
  } finally {
    // Step 3: Always restore the API directory
    const backupExists = await exists(apiDirHidden);
    if (backupExists) {
      console.log("♻️  Restoring src/app/_api_tauri_backup → src/app/api ...");
      await rename(apiDirHidden, apiDir);
      console.log("✅ API directory restored.");
    }
  }
}

main().catch((err) => {
  console.error("❌ Tauri build failed:", err);
  process.exit(1);
});
