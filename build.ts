// Build script for production
// Bundles client and optionally compiles server

const startTime = performance.now();

console.log("🔨 Building for production...\n");

// Build client bundle
const clientResult = await Bun.build({
  entrypoints: ["./src/client.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
  splitting: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

if (!clientResult.success) {
  console.error("❌ Client build failed:");
  console.error(clientResult.logs);
  process.exit(1);
}

console.log("✅ Client bundle:");
for (const output of clientResult.outputs) {
  const size = (output.size / 1024).toFixed(1);
  console.log(`   ${output.path} (${size}kb)`);
}

// Optional: Compile server to single executable
const compileServer = process.argv.includes("--compile");

if (compileServer) {
  console.log("\n📦 Compiling server executable...");

  const proc = Bun.spawn(["bun", "build", "--compile", "server.tsx", "--outfile", "dist/server"], {
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;
  console.log("✅ Server compiled to dist/server");
}

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
console.log(`\n✨ Build complete in ${elapsed}s`);
console.log("\nTo run:");
console.log("  bun run start");
