import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

// Integration suite: exercises the Firestore data layer against the emulator.
// Run via `npm run test:emulator`, which wraps this in `firebase emulators:exec`
// so FIRESTORE_EMULATOR_HOST is set and the Admin SDK routes to the emulator.
export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      "server-only": fileURLToPath(
        new URL("./test/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["lib/**/*.emulator.test.ts"],
    testTimeout: 15000,
    hookTimeout: 30000,
    // Tests share one emulator; run files serially to keep data isolated.
    fileParallelism: false,
  },
});
