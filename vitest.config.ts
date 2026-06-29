import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

// Default (fast) suite: pure logic only, no Firestore. Emulator-backed tests
// (*.emulator.test.ts) are excluded — run them via `npm run test:emulator`.
export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // Provided by Next.js at runtime; stubbed so Node/Vitest can import it.
      "server-only": fileURLToPath(
        new URL("./test/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    exclude: ["**/*.emulator.test.ts", "node_modules/**"],
  },
});
