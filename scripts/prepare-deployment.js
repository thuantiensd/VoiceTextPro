#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('Preparing deployment files for external hosting...');

// Create deployment README
const deploymentGuide = `# VoiceText Pro - Deployment Guide

## Environment Variables Required

### Database
- DATABASE_URL=postgresql://username:password@host:port/database

### API Keys
- FPT_API_KEY=your_fpt_api_key
- OPENAI_API_KEY=your_openai_api_key

### Session
- SESSION_SECRET=your_random_session_secret_here

## Database Setup

1. Create PostgreSQL database
2. Run migrations:
   \`\`\`bash
   npm run db:push
   \`\`\`

## Production Deployment

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Build the project:
   \`\`\`bash
   npm run build
   \`\`\`

3. Start production server:
   \`\`\`bash
   npm run start
   \`\`\`

## File Structure
- \`client/\` - React frontend
- \`server/\` - Express backend
- \`shared/\` - Shared types and schemas
- \`uploads/\` - Audio file storage (create this directory)

## Important Notes
- Make sure uploads directory exists and is writable
- Configure your hosting to serve static files from dist/
- Set NODE_ENV=production for production builds
- Ensure database connection is stable for best performance
`;

// Create production package.json script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  "build": "vite build",
  "start": "NODE_ENV=production tsx server/index.ts",
  "db:push": "drizzle-kit push"
};

// Create .env.example
const envExample = `# Database
DATABASE_URL=postgresql://username:password@host:port/database

# API Keys
FPT_API_KEY=your_fpt_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# Environment
NODE_ENV=production
`;

// Write files
fs.writeFileSync('DEPLOYMENT.md', deploymentGuide);
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
fs.writeFileSync('.env.example', envExample);

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('Created uploads directory');
}

console.log('✅ Deployment files prepared:');
console.log('- DEPLOYMENT.md - Setup instructions');
console.log('- .env.example - Environment variables template');
console.log('- package.json - Updated with production scripts');
console.log('- uploads/ - Directory for audio files');