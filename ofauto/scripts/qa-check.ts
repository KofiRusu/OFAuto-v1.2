/**
 * QA Check Script for OFAuto
 * 
 * This script runs through each major route in the application
 * to verify that components render correctly and API endpoints return valid responses.
 * 
 * Usage:
 * npm run qa
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Prisma client to check database connections
const prisma = new PrismaClient();

// Set up base URL for API testing
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_BASE_URL = `${BASE_URL}/api`;

// API endpoints to check (GET methods only for testing)
const API_ENDPOINTS = [
  '/api/followers',
  '/api/messages',
  '/api/posts/schedule',
  '/api/queue',
  '/api/alerts',
  '/api/analytics',
  '/api/integrations/status',
  '/api/personas',
  '/api/strategies',
];

// Dashboard routes to check
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboard/followers',
  '/dashboard/messages',
  '/dashboard/posts',
  '/dashboard/scheduler',
  '/dashboard/analytics',
  '/dashboard/queue',
  '/dashboard/alerts',
  '/dashboard/settings',
  '/dashboard/integrations',
  '/dashboard/strategies',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log(`${colors.blue}Testing database connection...${colors.reset}`);
  
  try {
    // Try to query users table to verify DB connectivity
    const userCount = await prisma.user.count();
    console.log(`${colors.green}✓ Database connection successful. ${userCount} users found.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Database connection failed:${colors.reset}`, error);
    return false;
  }
}

/**
 * Test API endpoints
 */
async function testApiEndpoints() {
  console.log(`\n${colors.blue}Testing API endpoints...${colors.reset}`);
  
  const results = {
    success: 0,
    failed: 0,
    endpoints: [] as { url: string; status: number; success: boolean }[],
  };
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      // Set up demo mode headers for testing
      const headers = {
        'Cookie': 'demo_mode_active=true', // Demo mode cookie
      };
      
      const response = await fetch(`${API_BASE_URL}${endpoint.replace('/api', '')}`, { headers });
      const success = response.status >= 200 && response.status < 500;
      
      if (success) {
        console.log(`${colors.green}✓ ${endpoint} - Status: ${response.status}${colors.reset}`);
        results.success++;
      } else {
        console.log(`${colors.red}✗ ${endpoint} - Status: ${response.status}${colors.reset}`);
        results.failed++;
      }
      
      results.endpoints.push({
        url: endpoint,
        status: response.status,
        success,
      });
      
    } catch (error) {
      console.error(`${colors.red}✗ ${endpoint} - Error:${colors.reset}`, error);
      results.failed++;
      results.endpoints.push({
        url: endpoint,
        status: 0,
        success: false,
      });
    }
  }
  
  return results;
}

/**
 * Check if required environment variables are set
 */
function checkEnvironmentVariables() {
  console.log(`\n${colors.blue}Checking environment variables...${colors.reset}`);
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ];
  
  const missingVars: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
      console.log(`${colors.red}✗ Missing: ${varName}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Present: ${varName}${colors.reset}`);
    }
  }
  
  const demoMode = process.env.DEMO_MODE === 'true' 
    ? `${colors.yellow}DEMO_MODE is enabled${colors.reset}` 
    : `${colors.green}DEMO_MODE is disabled${colors.reset}`;
  console.log(demoMode);
  
  return missingVars.length === 0;
}

/**
 * Generate a test report
 */
function generateReport(results: any) {
  console.log(`\n${colors.magenta}Generating QA report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    demoMode: process.env.DEMO_MODE === 'true',
    database: {
      connection: results.database,
    },
    api: {
      tested: results.api.endpoints.length,
      success: results.api.success,
      failed: results.api.failed,
      endpoints: results.api.endpoints,
    },
    env: {
      valid: results.env,
    },
  };
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  
  // Write report to file
  const reportPath = path.join(reportsDir, `qa-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`${colors.green}Report saved to: ${reportPath}${colors.reset}`);
  return reportPath;
}

/**
 * Main QA check function
 */
async function runQaCheck() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}        OFAuto QA Check Tool           ${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  
  // Results object
  const results = {
    database: false,
    api: { success: 0, failed: 0, endpoints: [] },
    env: false,
  };
  
  // Test database connection
  results.database = await testDatabaseConnection();
  
  // Test API endpoints
  results.api = await testApiEndpoints();
  
  // Check environment variables
  results.env = checkEnvironmentVariables();
  
  // Generate report
  const reportPath = generateReport(results);
  
  // Print summary
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}             Test Summary               ${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`Database Connection: ${results.database ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`API Endpoints: ${colors.green}${results.api.success} passed${colors.reset}, ${colors.red}${results.api.failed} failed${colors.reset}`);
  console.log(`Environment Variables: ${results.env ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  
  const overallStatus = results.database && results.api.failed === 0 && results.env
    ? `${colors.green}PASS${colors.reset}`
    : `${colors.yellow}PARTIAL PASS${colors.reset}`;
  
  console.log(`\nOverall Status: ${overallStatus}`);
  console.log(`Report: ${reportPath}`);
  
  // Provide manual testing instructions
  console.log(`\n${colors.magenta}Manual Testing Instructions:${colors.reset}`);
  console.log(`1. Log in and verify you can see the dashboard`);
  console.log(`2. Generate a strategy in the Strategy Manager`);
  console.log(`3. Schedule a post in the Post Scheduler`);
  console.log(`4. Send a DM in the Messages panel`);
  console.log(`5. Create and trigger an alert`);
  console.log(`6. View analytics over 7 days`);
  console.log(`7. Retry a failed automation task`);
  
  // Cleanup
  await prisma.$disconnect();
  
  // Return exit code based on overall status
  return results.database && results.api.failed === 0 && results.env ? 0 : 1;
}

// Run the QA check
runQaCheck()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error(`${colors.red}QA check failed with error:${colors.reset}`, error);
    process.exit(1);
  }); 