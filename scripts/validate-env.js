const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Required variables
const requiredVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY', 
  'NEXT_PUBLIC_APP_URL',
  'PLATFORM_CREDENTIAL_SECRET'
];

// Optional variables with default values
const optionalVars = {
  'NODE_ENV': 'development',
  'ENABLE_MOCK_PLATFORMS': 'true',
  'MOCK_AI_RESPONSES': 'true',
  'LOG_LEVEL': 'info',
  'DISABLE_RATE_LIMITS': 'true',
  'DEMO_MODE': 'false',
  'OPENAI_API_KEY': '',
  'ANTHROPIC_API_KEY': '',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL': '/login',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL': '/signup',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL': '/dashboard',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL': '/dashboard',
  'LLM_PROVIDER': 'openai',
  'LLM_MODEL': 'gpt-4',
  'COOKIE_SECRET': 'development-cookie-secret'
};

// Check required variables
const missing = requiredVars.filter(name => !process.env[name]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(name => console.error(`  - ${name}`));
  process.exit(1);
}

// Set default values for optional variables
Object.entries(optionalVars).forEach(([name, defaultValue]) => {
  if (!process.env[name]) {
    process.env[name] = defaultValue;
    console.log(`ℹ️ Setting default value for ${name}: ${defaultValue}`);
    
    // Update .env.local file
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    if (!envContent.includes(`${name}=`)) {
      envContent += `\n${name}=${defaultValue}`;
      fs.writeFileSync(envPath, envContent);
    }
  }
});

console.log('✅ Environment validation passed!');
console.log('Environment configuration:');
[...requiredVars, ...Object.keys(optionalVars)].forEach(name => {
  const value = process.env[name];
  // Mask sensitive values
  const displayValue = name.includes('KEY') || name.includes('SECRET') || name.includes('TOKEN')
    ? value.substr(0, 4) + '****************' 
    : value;
  console.log(`  - ${name}: ${displayValue}`);
}); 