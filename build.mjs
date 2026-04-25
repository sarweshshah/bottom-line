import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeOrigin(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.origin;
  } catch {
    throw new Error(
      `Invalid FIGMA_OAUTH_BACKEND_ORIGIN: "${raw}". Expected a full URL such as https://oauth.example.com`,
    );
  }
}

function copyManifestToDist({ isWatch }) {
  const manifestPath = path.join(__dirname, "manifest.json");
  const distPath = path.join(__dirname, "dist");
  const distManifestPath = path.join(distPath, "manifest.json");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const oauthBackendOrigin = normalizeOrigin(
    process.env.FIGMA_OAUTH_BACKEND_ORIGIN || "",
  );
  // Adjust paths for manifest living in dist (relative to dist folder)
  manifest.main = "code.js";
  manifest.ui = "index.html";

  manifest.networkAccess = manifest.networkAccess || {};
  manifest.networkAccess.allowedDomains =
    manifest.networkAccess.allowedDomains || [];

  if (oauthBackendOrigin) {
    const isHttps = oauthBackendOrigin.startsWith("https://");
    const isLocalHttp = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
      oauthBackendOrigin,
    );

    if (!isWatch && !isHttps) {
      throw new Error(
        `FIGMA_OAUTH_BACKEND_ORIGIN must be HTTPS for release builds. Got: ${oauthBackendOrigin}`,
      );
    }
    if (isWatch && !isHttps && !isLocalHttp) {
      throw new Error(
        `For dev watch mode, use HTTPS or localhost for FIGMA_OAUTH_BACKEND_ORIGIN. Got: ${oauthBackendOrigin}`,
      );
    }

    if (!manifest.networkAccess.allowedDomains.includes(oauthBackendOrigin)) {
      manifest.networkAccess.allowedDomains.push(oauthBackendOrigin);
    }
  }

  // Never ship localhost dev allowances in release builds.
  if (!isWatch) {
    delete manifest.networkAccess.devAllowedDomains;
  }

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
  copyManifestToDist({ isWatch: true });
  console.log("[sandbox] watching for changes...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  copyManifestToDist({ isWatch: false });
  console.log("[sandbox] build complete");
}
