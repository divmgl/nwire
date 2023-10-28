const esbuild = require("esbuild")

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outdir: "dist/cjs",
    platform: "node",
    format: "cjs",
    target: ["node14"],
    sourcemap: true,
    bundle: true,
  })
  .catch(() => process.exit(1))

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outdir: "dist/esm",
    platform: "node",
    format: "esm",
    target: ["node14"],
    sourcemap: true,
    bundle: true,
  })
  .catch(() => process.exit(1))
