#!/usr/bin/env node

/**
 * Smoke tests for the OFAuto UI deployment
 * Run with: node smoke-test.js --url=https://example.com
 */

const https = require('https');
const { URL } = require('url');
const { exit } = require('process');

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));

if (!urlArg) {
  console.error('Error: URL not provided. Use --url=https://example.com');
  exit(1);
}

const baseUrl = urlArg.replace('--url=', '');
console.log(`Running smoke tests against: ${baseUrl}`);

// Test endpoints to check
const endpoints = [
  { path: '/', expectedStatus: 200, name: 'Homepage' },
  { path: '/api/health', expectedStatus: 200, name: 'Health check endpoint' },
  { path: '/auth/signin', expectedStatus: 200, name: 'Sign-in page' },
  { path: '/non-existent-page', expectedStatus: 404, name: 'Non-existent page (should 404)' }
];

// Function to make an HTTPS request and check status
function checkEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, baseUrl);
    
    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'User-Agent': 'OFAuto-Smoke-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const { statusCode } = res;
      
      if (statusCode === endpoint.expectedStatus) {
        console.log(`✅ ${endpoint.name}: SUCCESS (${statusCode})`);
        resolve(true);
      } else {
        console.error(`❌ ${endpoint.name}: FAILED - Expected ${endpoint.expectedStatus}, got ${statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.error(`❌ ${endpoint.name}: ERROR - ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('Starting smoke tests...');
  const results = await Promise.all(endpoints.map(checkEndpoint));
  
  const passedCount = results.filter(result => result).length;
  const failedCount = results.length - passedCount;
  
  console.log('\n--- Smoke Test Results ---');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  
  if (failedCount > 0) {
    console.error('\n❌ Smoke tests FAILED');
    exit(1);
  } else {
    console.log('\n✅ All smoke tests PASSED');
    exit(0);
  }
}

runTests(); 