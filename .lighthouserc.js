module.exports = {
  ci: {
    collect: {
      // Static options
      staticDistDir: './.next',
      
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/dashboard/posts',
        'http://localhost:3000/demo/feature-flags',
      ],
      
      // Number of runs
      numberOfRuns: 3,
    },
    upload: {
      // Upload to target or temporary storage
      target: 'temporary-public-storage',
    },
    assert: {
      // Assertions to validate
      preset: 'lighthouse:recommended',
      assertions: {
        // Accessibility assertions
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',
        
        // Performance assertions
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        'max-potential-fid': ['warn', { maxNumericValue: 300 }],
        
        // PWA assertions - set to warn since this is not a PWA
        'installable-manifest': 'warn',
        'service-worker': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        
        // Allow HTTP instead of HTTPS for local testing
        'uses-http2': 'off',
        'uses-https': 'off',
        
        // Turn off some performance metrics that might be irrelevant for testing
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'uses-optimized-images': 'warn',
      },
    },
  },
}; 