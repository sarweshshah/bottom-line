import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyManifestToDist() {
  const manifestPath = path.join(__dirname, "manifest.json");
  const distPath = path.join(__dirname, "dist");
  const distManifestPath = path.join(distPath, "manifest.json");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  // Adjust paths for manifest living in dist (relative to dist folder)
  manifest.main = "code.js";
  manifest.ui = "index.html";

  fs.mkdirSync(distPath, { recursive: true });
  fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));
  console.log("[sandbox] manifest copied to dist/");
}

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/plugin/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  format: "esm",
  target: "es2017",
  platform: "neutral",
  tsconfig: "tsconfig.sandbox.json",
  alias: {
    "@shared": "./src/shared",
  },
});

if (watch) {
  await ctx.watch();
  copyManifestToDist();
  console.log("[sandbox] watching for changes...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  copyManifestToDist();
  console.log("[sandbox] build complete");
}
