// protoc-plugin-wrapper.js

async function main() {
  // 1. This uses dynamic import to load the main plugin file.
  const plugin = await import('./protoc-plugin.js');

  // 2. The main plugin's entry point is likely a function (like 'main' or 'run').
  //    It might be exported as 'main' or be the default export.
  //    You will need to confirm the export name from the compiled plugin file.

  // If the main plugin is compiled to use an 'exports.run' or similar:
  if (plugin && plugin.run) {
      plugin.run();
  } else if (plugin && typeof plugin.default === 'function') {
      // If the plugin is the default function export:
      plugin.default();
  } else {
      // Attempt to run the main logic, common for protoc plugins
      // You may need to inspect the compiled JS to find the correct entry point.
      // For many TypeScript/Node generators, the core logic is often executed
      // immediately upon import, or exposed as a 'main' function.
      if (plugin.main) {
          plugin.main();
      }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});