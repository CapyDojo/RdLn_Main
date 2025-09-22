/**
 * Complete Electron Setup Script
 * Downloads all assets and prepares for offline bundling
 */

import { downloadFonts } from './download-fonts.js';
import { downloadTesseractAssets } from './download-tesseract-assets.js';
import { SetupVerifier } from './setup-verification.js';
import { AssetManager } from './asset-manager.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupElectron() {
  console.log('🚀 Starting complete Electron setup...');
  console.log('📋 This will download all assets for full offline functionality\n');
  
  try {
    // Step 1: Install dependencies
    console.log('📦 Checking dependencies...');
    
    try {
      execSync('npm list concurrently', { stdio: 'ignore' });
      console.log('✅ Dependencies already installed');
    } catch {
      console.log('📥 Installing missing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Step 2: Download fonts
    console.log('\n🔤 Step 1: Downloading fonts...');
    await downloadFonts();
    
    // Step 3: Download Tesseract assets  
    console.log('\n🔧 Step 2: Downloading Tesseract assets...');
    await downloadTesseractAssets();
    
    // Step 4: Create Vite build configuration for Electron
    console.log('\n⚙️  Step 3: Configuring build system...');
    await createElectronViteConfig();
    
    // Step 5: Update HTML for production
    console.log('\n📄 Step 4: Preparing HTML for Electron...');
    await prepareElectronHTML();
    
    // Step 5: Prepare assets for build
    console.log('\n📦 Step 5: Preparing assets...');
    const assetManager = new AssetManager();
    await assetManager.prepareForBuild();
    
    // Step 6: Final verification
    console.log('\n✅ Step 6: Running comprehensive verification...');
    const verifier = new SetupVerifier();
    const result = await verifier.runFullVerification();
    
    if (!result.success) {
      console.error('\n❌ Setup verification failed!');
      console.error('Please fix the errors above before proceeding.');
      process.exit(1);
    }
    
    console.log('\n🎉 Electron setup completed successfully!');
    console.log('\n📋 Available commands:');
    console.log('   npm run electron:dev        - Start development server');
    console.log('   npm run electron:build:win  - Build for Windows');
    console.log('   npm run verify:setup        - Run setup verification');
    console.log('   npm run prepare:assets      - Prepare assets for build');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Run: npm run electron:dev');
    console.log('2. Test drag & drop functionality');
    console.log('3. Test OCR with local assets');
    console.log('4. Build production: npm run electron:build:win');
    console.log('5. Check asset integrity: npm run verify:assets');
    
  } catch (error) {
    console.error('❌ Electron setup failed:', error);
    process.exit(1);
  }
}

async function createElectronViteConfig() {
  const electronViteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite configuration for Electron builds
export default defineConfig({
  plugins: [react()],
  
  // Build configuration for Electron
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index-electron.html')
      }
    },
    
    // Include all assets in build
    assetsDir: 'assets',
    copyPublicDir: true,
    
    // Ensure all assets are copied
    assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf', '**/*.traineddata', '**/*.wasm.js'],
  },
  
  // Public directory configuration
  publicDir: 'public',
  
  // Base path for assets
  base: './',
  
  // Development server
  server: {
    port: 5173,
    host: 'localhost'
  }
});
`;

  await fs.writeFile(path.join(__dirname, '../vite.electron.config.ts'), electronViteConfig);
  console.log('✅ Created Electron Vite configuration');
}

async function prepareElectronHTML() {
  // Copy the electron HTML to dist during build
  const electronBuildScript = `/**
 * Post-build script for Electron
 * Copies Electron-specific HTML and ensures all assets are properly linked
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function postBuild() {
  const distDir = path.join(__dirname, '../dist');
  const electronHTML = path.join(__dirname, '../public/index-electron.html');
  
  try {
    // Copy Electron HTML to dist
    const htmlContent = await fs.readFile(electronHTML, 'utf8');
    
    // Update paths for built assets
    const updatedHTML = htmlContent
      .replace('./src/main.tsx', './assets/main.js')
      .replace('./fonts/fonts.css', './fonts/fonts.css');
    
    await fs.writeFile(path.join(distDir, 'index.html'), updatedHTML);
    console.log('✅ Prepared HTML for Electron build');
    
  } catch (error) {
    console.error('❌ Failed to prepare Electron HTML:', error);
    throw error;
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  postBuild();
}

export { postBuild };
`;

  await fs.writeFile(path.join(__dirname, 'post-build-electron.js'), electronBuildScript);
  console.log('✅ Created post-build script');
}

// Legacy verification function - replaced by SetupVerifier class
async function verifySetup() {
  console.log('ℹ️  Legacy verification - use SetupVerifier class for comprehensive checks');
  const verifier = new SetupVerifier();
  return await verifier.runFullVerification();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupElectron();
}

export { setupElectron };