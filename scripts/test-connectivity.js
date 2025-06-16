#!/usr/bin/env node

const http = require('http');

function checkBackend() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend is healthy:', data);
          resolve(true);
        } else {
          console.error('❌ Backend returned status:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Backend connection failed:', err.message);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('Testing backend connectivity...');
  const isHealthy = await checkBackend();
  process.exit(isHealthy ? 0 : 1);
}

main();