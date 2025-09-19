#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps you create the .env file with proper MongoDB configuration
 * 
 * Usage: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 MongoDB Atlas Environment Setup');
console.log('==================================\n');

console.log('This script will help you create the .env file for your MongoDB Atlas connection.\n');

// Function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to generate random secret
function generateSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function setupEnvironment() {
  try {
    console.log('📋 MongoDB Atlas Connection Details:');
    console.log('====================================\n');
    
    const username = await askQuestion('Enter your MongoDB username: ');
    const password = await askQuestion('Enter your MongoDB password: ');
    const clusterUrl = await askQuestion('Enter your cluster URL (e.g., cluster0.xxxxx.mongodb.net): ');
    const databaseName = await askQuestion('Enter your database name (e.g., roven-global): ');
    
    // URL encode the password
    const encodedPassword = encodeURIComponent(password);
    
    console.log('\n🔐 Password Encoding:');
    console.log('====================');
    console.log(`Original password: ${password}`);
    console.log(`URL-encoded password: ${encodedPassword}`);
    
    // Generate secrets
    const accessTokenSecret = generateSecret();
    const refreshTokenSecret = generateSecret();
    const sessionSecret = generateSecret();
    
    // Create .env content
    const envContent = `# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://${username}:${encodedPassword}@${clusterUrl}/${databaseName}?retryWrites=true&w=majority

# JWT Secret Keys (Generated automatically)
SECRET_KEY_ACCESS_TOKEN=${accessTokenSecret}
SECRET_KEY_REFRESH_TOKEN=${refreshTokenSecret}

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email Configuration (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google OAuth (if using Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
`;

    // Write .env file
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ .env file created successfully!');
    console.log('==================================');
    console.log(`Location: ${envPath}`);
    console.log('\n📋 Your MongoDB connection string:');
    console.log(`mongodb+srv://${username}:${encodedPassword}@${clusterUrl}/${databaseName}?retryWrites=true&w=majority`);
    
    console.log('\n⚠️  Next Steps:');
    console.log('===============');
    console.log('1. Verify your MongoDB Atlas user has "Read and write to any database" role');
    console.log('2. Add your IP address to MongoDB Atlas Network Access whitelist');
    console.log('3. Restart your server: npm run dev');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  } finally {
    rl.close();
  }
}

setupEnvironment();
