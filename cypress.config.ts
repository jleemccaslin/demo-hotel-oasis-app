import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{ts,js}",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
});
