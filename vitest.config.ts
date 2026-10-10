import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts on purpose: the ESLint plugin loaded there keeps a worker alive, which stops the test run from exiting
export default defineConfig({
  test: {
    // Undo every vi.spyOn, vi.stubGlobal and vi.stubEnv before the next test, so no test can leak into another
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
});
