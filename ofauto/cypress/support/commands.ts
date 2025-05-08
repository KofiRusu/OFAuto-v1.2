/// <reference types="cypress" />

// Extend the Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): void
    }
  }
}

// Custom login command using Clerk
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  // This is a placeholder for actual Clerk authentication
  // In real tests, we might use Cypress environment variables or fixtures
  cy.log(`Logging in as ${email}`);
  
  // Simulate a successful login
  cy.window().then((win) => {
    // Set some mock values in localStorage to simulate being logged in
    win.localStorage.setItem('user', JSON.stringify({ email, name: 'Test User' }));
  });
});

// Custom command to connect a platform
Cypress.Commands.add('connectPlatform', (platform, credentials) => {
  cy.log(`Connecting ${platform} platform with test credentials`);
  
  // Navigate to dashboard
  cy.visit('/dashboard');
  
  // Click on the "Connected Accounts" tab
  cy.contains('Connected Accounts').click();
  
  // Find the platform row and click connect
  cy.contains(platform).parents('[data-cy=platform-item]').within(() => {
    cy.get('[data-cy=connect-button]').click();
  });
  
  // Fill in the credentials
  if (platform === 'Ko-fi') {
    cy.get('[data-cy=api-key-input]').type(credentials.apiKey);
  } else if (platform === 'Fansly' || platform === 'OnlyFans') {
    cy.get('[data-cy=email-input]').type(credentials.email);
    cy.get('[data-cy=password-input]').type(credentials.password);
  }
  
  // Submit the form
  cy.get('[data-cy=connect-submit]').click();
  
  // Verify connection confirmation
  cy.contains(`Successfully connected to ${platform}`).should('be.visible');
});

// Declare the commands on the global Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      connectPlatform(
        platform: 'Ko-fi' | 'Patreon' | 'Fansly' | 'OnlyFans' | 'Gumroad' | 'Twitter' | 'Instagram',
        credentials: Record<string, string>
      ): Chainable<void>;
    }
  }
}

export {}; 