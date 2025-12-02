// Production build script
const startTime = performance.now();

console.log("Building for production...\n");

// Build client bundle
const clientResult = await Bun.build({
  entrypoints: ["./src/client.tsx"],
  outdir: "./dist/client",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
  splitting: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "import.meta.env.DEV": JSON.stringify(false),
  },
});

if (!clientResult.success) {
  console.error("Client build failed:");
  console.error(clientResult.logs);
  process.exit(1);
}

console.log("Client bundle:");
for (const output of clientResult.outputs) {
  const size = (output.size / 1024).toFixed(1);
  console.log(`  ${output.path} (${size}kb)`);
}

// Compile server to single executable (optional)
const compileServer = process.argv.includes("--compile");

if (compileServer) {
  console.log("\nCompiling server executable...");

  const proc = Bun.spawn(
    ["bun", "build", "--compile", "server.tsx", "--outfile", "dist/server"],
    {
      stdout: "inherit",
      stderr: "inherit",
    }
  );

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error("Server compilation failed");
    process.exit(1);
  }
  console.log("Server compiled to dist/server");
}

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
console.log(`\nBuild complete in ${elapsed}s`);
console.log("\nTo run: bun run start");
