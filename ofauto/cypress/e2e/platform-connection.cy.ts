describe('Platform Connection', () => {
  beforeEach(() => {
    // Log in (use visit instead of custom command)
    cy.visit('/sign-in');
    
    // Visit the dashboard page
    cy.visit('/dashboard');
  });

  it('should display the connected accounts section', () => {
    cy.contains('Connected Accounts').should('be.visible');
  });

  it('should open the connect platform modal when "Connect New Platform" is clicked', () => {
    // Find and click the connect platform button
    cy.contains('Connect New Platform').click();
    
    // Check that the modal is displayed
    cy.contains('Connect Platform').should('be.visible');
  });

  it('should display platform connection options', () => {
    // Check that platform connection cards are visible
    cy.contains('Connected Accounts').should('be.visible');
    cy.contains('OnlyFans').should('be.visible');
    cy.contains('Patreon').should('be.visible');
    cy.contains('Ko-fi').should('be.visible');
    cy.contains('Fansly').should('be.visible');
  });

  it('should connect to Ko-fi with API key', () => {
    // Intercept the API call
    cy.intercept('POST', '/api/trpc/platformConnections.connectKofi', {
      statusCode: 200,
      body: {
        result: {
          data: {
            success: true,
            platform: 'kofi'
          }
        }
      }
    }).as('connectKofi');

    // Find Ko-fi and click connect
    cy.contains('Ko-fi')
      .parents('.flex')
      .contains('Connect')
      .click();

    // Modal should appear
    cy.contains('Connect Ko-fi').should('be.visible');
    
    // Fill in API key
    cy.get('input[name="apiKey"]').type('test-api-key-12345');
    
    // Submit form
    cy.contains('button', 'Save Credentials').click();
    
    // Wait for API call and check success message
    cy.wait('@connectKofi');
    cy.contains('Success').should('be.visible');
  });

  it('should connect to OnlyFans with username/password', () => {
    // Intercept the API call
    cy.intercept('POST', '/api/trpc/platformConnections.connectUserPass', {
      statusCode: 200,
      body: {
        result: {
          data: {
            success: true,
            platform: 'onlyfans'
          }
        }
      }
    }).as('connectOnlyFans');

    // Find OnlyFans and click connect
    cy.contains('OnlyFans')
      .parents('.flex')
      .contains('Connect')
      .click();

    // Modal should appear
    cy.contains('Connect OnlyFans').should('be.visible');
    
    // Fill in credentials
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    
    // Submit form
    cy.contains('button', 'Save Credentials').click();
    
    // Wait for API call and check success message
    cy.wait('@connectOnlyFans');
    cy.contains('Success').should('be.visible');
  });

  it('should disconnect a platform', () => {
    // Intercept the API call
    cy.intercept('POST', '/api/trpc/platformConnections.disconnectPlatform', {
      statusCode: 200,
      body: {
        result: {
          data: {
            success: true,
            platform: 'fansly'
          }
        }
      }
    }).as('disconnectPlatform');

    // First make sure Fansly shows as connected
    cy.contains('Fansly')
      .parents('.flex')
      .contains('Disconnect')
      .click();
    
    // Confirm the action (this will depend on your UI implementation)
    cy.on('window:confirm', () => true);
    
    // Wait for API call and check success message
    cy.wait('@disconnectPlatform');
    cy.contains('Successfully disconnected').should('be.visible');
  });
}); 