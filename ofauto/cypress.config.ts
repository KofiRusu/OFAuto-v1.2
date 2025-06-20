import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    supportFile: './cypress/support/e2e.ts',
    specPattern: './cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    specPattern: './cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
}); 