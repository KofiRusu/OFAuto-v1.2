#!/usr/bin/env node

const http = require('http');

// Test backend connectivity
function testBackend() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test frontend connectivity
function testFrontend() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve({ status: res.statusCode });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🔍 Testing API Connectivity...\n');

  // Test backend
  try {
    console.log('Testing Backend (localhost:4000)...');
    const backendResult = await testBackend();
    console.log('✅ Backend is running!');
    console.log(`   Status: ${backendResult.status}`);
    console.log(`   Response: ${JSON.stringify(backendResult.data, null, 2)}\n`);
  } catch (error) {
    console.log('❌ Backend test failed:', error.message);
  }

  // Test frontend
  try {
    console.log('Testing Frontend (localhost:3000)...');
    const frontendResult = await testFrontend();
    console.log('✅ Frontend is running!');
    console.log(`   Status: ${frontendResult.status}\n`);
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
  }

  console.log('🎯 Connectivity test completed!');
}

runTests().catch(console.error); 