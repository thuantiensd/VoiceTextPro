import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Building VoiceText Pro for production...');

// Create build directories
if (!existsSync('build-output')) {
  mkdirSync('build-output', { recursive: true });
}
if (!existsSync('build-output/server')) {
  mkdirSync('build-output/server', { recursive: true });
}

try {
  // Build client
  console.log('📦 Building client...');
  execSync('npx vite build --outDir build-output/client', { stdio: 'inherit' });

  // Build server  
  console.log('🔧 Building server...');
  execSync('npx tsc --project tsconfig.server.json', { stdio: 'inherit' });

  // Copy essential files
  console.log('📋 Copying configuration files...');
  const filesToCopy = [
    'package.json',
    'drizzle.config.ts',
    'railway.json'
  ];

  filesToCopy.forEach(file => {
    if (existsSync(file)) {
      copyFileSync(file, join('build-output', file));
      console.log(`✅ Copied ${file}`);
    }
  });

  console.log('✨ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}