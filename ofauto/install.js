#!/usr/bin/env node

/**
 * OFAuto Installation Script
 * 
 * This script guides users through setting up OFAuto with
 * proper environment variables and database configuration.
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m"
};

// Helper to prompt for text input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Helper to prompt for yes/no input
const confirm = async (question, defaultYes = true) => {
  const defaultText = defaultYes ? 'Y/n' : 'y/N';
  const answer = await prompt(`${question} [${defaultText}]: `);
  return answer.toLowerCase() === 'y' || 
         answer.toLowerCase() === 'yes' || 
         (defaultYes && answer === '');
};

// Main installation function
async function install() {
  console.log(`\n${colors.cyan}=============================================${colors.reset}`);
  console.log(`${colors.cyan}           OFAuto Installation Wizard         ${colors.reset}`);
  console.log(`${colors.cyan}=============================================${colors.reset}\n`);
  
  console.log(`${colors.blue}This wizard will guide you through setting up OFAuto.${colors.reset}\n`);
  
  // Check if required tools are installed
  console.log(`${colors.yellow}Checking prerequisites...${colors.reset}`);
  
  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(`Node.js: ${nodeVersion}`);
    
    // Parse version (e.g., v16.13.0 -> 16)
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);
    if (majorVersion < 16) {
      console.error(`${colors.red}Error: OFAuto requires Node.js v16 or higher${colors.reset}`);
      process.exit(1);
    }
    
    // Check npm version
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`npm: ${npmVersion}`);
    
    // Check for git
    execSync('git --version').toString().trim();
    console.log(`git: installed`);
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    console.error(`${colors.red}Please make sure you have Node.js, npm, and git installed.${colors.reset}`);
    process.exit(1);
  }
  
  // Ask about database
  console.log(`\n${colors.blue}Database Configuration${colors.reset}`);
  const useLocal = await confirm('Do you want to use a local PostgreSQL database?');
  
  let dbUrl = '';
  if (useLocal) {
    const dbName = await prompt('Database name (ofauto): ') || 'ofauto';
    const dbUser = await prompt('Database user (postgres): ') || 'postgres';
    const dbPass = await prompt('Database password: ');
    const dbHost = await prompt('Database host (localhost): ') || 'localhost';
    const dbPort = await prompt('Database port (5432): ') || '5432';
    
    dbUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  } else {
    dbUrl = await prompt('Enter your PostgreSQL connection string: ');
  }
  
  // Ask about Clerk authentication
  console.log(`\n${colors.blue}Authentication Configuration${colors.reset}`);
  console.log(`OFAuto uses Clerk (https://clerk.dev) for authentication.`);
  console.log(`You'll need to create a Clerk account and set up a project.`);
  
  const setupClerk = await confirm('Do you have a Clerk account and want to set it up now?');
  
  let clerkPublishableKey = '';
  let clerkSecretKey = '';
  
  if (setupClerk) {
    console.log(`\nGet your API keys from the Clerk dashboard (API Keys section):`);
    clerkPublishableKey = await prompt('Clerk Publishable Key (starts with pk_): ');
    clerkSecretKey = await prompt('Clerk Secret Key (starts with sk_): ');
  } else {
    console.log(`\n${colors.yellow}You'll need to add your Clerk keys to .env.local later${colors.reset}`);
    clerkPublishableKey = 'pk_placeholder';
    clerkSecretKey = 'sk_placeholder';
  }
  
  // Ask about demo mode
  console.log(`\n${colors.blue}Demo Mode Configuration${colors.reset}`);
  const useDemoMode = await confirm('Do you want to enable demo mode? (Easier for testing)');
  
  // Create .env.local file
  console.log(`\n${colors.yellow}Creating environment files...${colors.reset}`);
  
  const envContent = `# Database
DATABASE_URL=${dbUrl}

# Auth - Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${clerkPublishableKey}
CLERK_SECRET_KEY=${clerkSecretKey}

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_MODE=${useDemoMode ? 'true' : 'false'}

# Security
COOKIE_SECRET=${crypto.randomBytes(32).toString('hex')}
`;

  fs.writeFileSync('.env.local', envContent);
  console.log(`${colors.green}Created .env.local file${colors.reset}`);
  
  // Install dependencies
  console.log(`\n${colors.yellow}Installing dependencies...${colors.reset}`);
  execSync('npm install', { stdio: 'inherit' });
  
  // Set up database
  console.log(`\n${colors.yellow}Setting up database...${colors.reset}`);
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log(`${colors.green}Database setup complete${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error setting up database: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}You may need to run these commands manually:${colors.reset}`);
    console.log(`npx prisma generate`);
    console.log(`npx prisma migrate deploy`);
  }
  
  // Seed data if demo mode is enabled
  if (useDemoMode) {
    console.log(`\n${colors.yellow}Seeding demo data...${colors.reset}`);
    try {
      execSync('npm run seed:demo', { stdio: 'inherit' });
      console.log(`${colors.green}Demo data seeded successfully${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error seeding demo data: ${error.message}${colors.reset}`);
    }
  }
  
  // Final instructions
  console.log(`\n${colors.green}=======================================${colors.reset}`);
  console.log(`${colors.green}  OFAuto installation completed!  ${colors.reset}`);
  console.log(`${colors.green}=======================================${colors.reset}`);
  console.log(`\nTo start the development server, run:`);
  console.log(`${colors.cyan}npm run dev${colors.reset}`);
  console.log(`\nThen open http://localhost:3000 in your browser`);
  
  if (useDemoMode) {
    console.log(`\n${colors.yellow}Demo Mode is enabled${colors.reset}`);
    console.log(`You can explore OFAuto with pre-populated data`);
  }
  
  rl.close();
}

// Run the installation
install().catch(error => {
  console.error(`${colors.red}Installation failed: ${error.message}${colors.reset}`);
  process.exit(1);
}); 