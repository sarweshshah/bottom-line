import esbuild from "esbuild";

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
  console.log("[sandbox] watching for changes...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("[sandbox] build complete");
}
