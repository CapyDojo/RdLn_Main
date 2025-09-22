/**
 * Fixed Electron Build Script
 * Addresses JSX runtime issues in production builds
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, '..');

async function buildElectronFixed() {
  console.log('🔧 Starting fixed Electron build process...');
  
  try {
    // Step 0: Ensure latest Tesseract core variants (SIMD/LSTM) are present
    console.log('📥 Downloading Tesseract core + language assets...');
    try {
      execSync('npm run download:tesseract', { stdio: 'inherit', cwd: baseDir });
    } catch (e) {
      console.warn('⚠️  Failed to pre-download Tesseract assets, continuing (may rely on existing files)');
    }

    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    const dirsToClean = ['dist', 'dist-electron-new'];
    for (const dir of dirsToClean) {
      try {
        await fs.rm(path.join(baseDir, dir), { recursive: true, force: true });
        console.log(`✅ Cleaned ${dir}`);
      } catch {
        console.log(`ℹ️  ${dir} not found or already clean`);
      }
    }
    
    // Step 2: Set proper environment variables
    console.log('⚙️  Setting build environment...');
    const buildEnv = {
      ...process.env,
      NODE_ENV: 'production',
      ELECTRON_BUILD: 'true',
      REACT_APP_BUILD_TARGET: 'electron',
      // Force production JSX runtime
      REACT_APP_JSX_RUNTIME: 'automatic'
    };
    
    console.log('📋 Build environment:');
    Object.entries(buildEnv)
      .filter(([key]) => key.startsWith('NODE_ENV') || key.startsWith('ELECTRON') || key.startsWith('REACT_APP'))
      .forEach(([key, value]) => console.log(`   ${key}=${value}`));
    
    // Step 3: Build React app with correct environment
    console.log('⚛️  Building React application...');
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: baseDir,
      env: buildEnv
    });
    
    // Step 4: Verify build output
    console.log('🔍 Verifying build output...');
    const distDir = path.join(baseDir, 'dist');
    const distContents = await fs.readdir(distDir);
    console.log(`✅ Dist directory contains: ${distContents.join(', ')}`);
    
    // Check for main JS file and verify it doesn't contain jsxDEV
    const jsFiles = distContents.filter(f => f.endsWith('.js') && f.includes('index-'));
    if (jsFiles.length > 0) {
      const mainJsPath = path.join(distDir, 'assets', jsFiles[0]);
      try {
        const jsContent = await fs.readFile(mainJsPath, 'utf8');
        if (jsContent.includes('jsxDEV')) {
          console.warn('⚠️  Warning: jsxDEV found in build output - may cause runtime issues');
        } else {
          console.log('✅ Build verified: No jsxDEV in production build');
        }
      } catch {
        // File might be in different location, that's OK
        console.log('ℹ️  Could not verify JS content (file location may vary)');
      }
    }
    
    // Step 5: Process HTML for Electron
    console.log('📄 Processing HTML for Electron...');
    execSync('npm run process:electron-html', {
      stdio: 'inherit',
      cwd: baseDir
    });
    
    // Step 6: Package Electron app
    console.log('📦 Packaging Electron application...');
    execSync('electron-builder --win --config src-electron/builder.config.cjs', {
      stdio: 'inherit',
      cwd: baseDir,
      env: buildEnv
    });
    
    console.log('🎉 Fixed Electron build completed successfully!');
    console.log('📁 Check dist-electron-new/ for output');
    
    // Final verification
    const electronOutputDir = path.join(baseDir, 'dist-electron-new');
    try {
      const electronContents = await fs.readdir(electronOutputDir);
      console.log(`✅ Electron output contains: ${electronContents.length} items`);
    } catch {
      console.warn('⚠️  Electron output directory not found');
    }
    
  } catch (error) {
    console.error('❌ Fixed Electron build failed:', error.message);
    throw error;
  }
}

// Run if called directly (robust across OS path/url formats)
const invokedDirectly = (() => {
  try {
    const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
    const thisPath = path.resolve(fileURLToPath(import.meta.url));
    return invokedPath && invokedPath === thisPath;
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  try {
    await buildElectronFixed();
    process.exit(0);
  } catch (error) {
    console.error('Build process failed:', error?.stack || error?.message || String(error));
    process.exit(1);
  }
}
