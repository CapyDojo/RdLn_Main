/**
 * Comprehensive Electron Setup Verification System
 * Validates all dependencies, assets, and configurations for build readiness
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SetupVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.startTime = Date.now();
  }

  logSuccess(message) {
    this.successes.push(message);
    console.log(`✅ ${message}`);
  }

  logWarning(message) {
    this.warnings.push(message);
    console.warn(`⚠️  ${message}`);
  }

  logError(message) {
    this.errors.push(message);
    console.error(`❌ ${message}`);
  }

  async checkNodeEnvironment() {
    console.log('\n🔍 Checking Node.js environment...');
    
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 20 && majorVersion < 21) {
        this.logSuccess(`Node.js ${nodeVersion} (compatible)`);
      } else {
        this.logError(`Node.js ${nodeVersion} - requires >= 20 < 21`);
      }
    } catch (error) {
      this.logError(`Node.js version check failed: ${error.message}`);
    }

    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.logSuccess(`npm ${npmVersion}`);
    } catch (error) {
      this.logError(`npm not found: ${error.message}`);
    }
  }

  async checkElectronDependencies() {
    console.log('\n🔍 Checking Electron dependencies...');
    
    const dependencies = [
      'electron',
      'electron-builder',
      'concurrently',
      'react',
      'typescript',
      'vite'
    ];

    for (const dep of dependencies) {
      try {
        execSync(`npm list ${dep}`, { stdio: 'ignore' });
        this.logSuccess(`${dep} installed`);
      } catch {
        this.logError(`${dep} not installed`);
      }
    }
  }

  async validateAssetStructure() {
    console.log('\n🔍 Validating asset structure...');
    
    const requiredStructure = [
      { path: 'public', type: 'dir', description: 'Public assets directory' },
      { path: 'public/fonts', type: 'dir', description: 'Google Fonts for offline use' },
      { path: 'public/tesseract', type: 'dir', description: 'Tesseract.js core files' },
      { path: 'public/tessdata', type: 'dir', description: 'OCR language models' },
      { path: 'public/images', type: 'dir', description: 'Application images' },
      { path: 'public/index-electron.html', type: 'file', description: 'Electron entry point' },
      { path: 'public/manifest.json', type: 'file', description: 'App manifest' },
      { path: 'src-electron', type: 'dir', description: 'Electron source files' },
      { path: 'src-electron/main.cjs', type: 'file', description: 'Electron main process' },
      { path: 'src-electron/preload.cjs', type: 'file', description: 'Preload script' },
      { path: 'src-electron/builder.config.cjs', type: 'file', description: 'Builder configuration' }
    ];

    for (const item of requiredStructure) {
      await this.checkPath(item);
    }
  }

  async checkPath(item) {
    const fullPath = path.join(__dirname, '..', item.path);
    
    try {
      const stats = await fs.stat(fullPath);
      
      if (item.type === 'dir' && stats.isDirectory()) {
        const files = await fs.readdir(fullPath);
        if (files.length > 0) {
          this.logSuccess(`${item.path}/ (${files.length} files) - ${item.description}`);
        } else {
          this.logWarning(`${item.path}/ is empty - ${item.description}`);
        }
      } else if (item.type === 'file' && stats.isFile()) {
        const sizeKB = Math.round(stats.size / 1024);
        this.logSuccess(`${item.path} (${sizeKB}KB) - ${item.description}`);
      } else {
        this.logError(`${item.path} - wrong type (expected ${item.type})`);
      }
    } catch {
      this.logError(`${item.path} - missing (${item.description})`);
    }
  }

  async checkTesseractAssets() {
    console.log('\n🔍 Checking Tesseract assets...');
    
    const tesseractCore = [
      'public/tesseract/tesseract-core.wasm.js',
      'public/tesseract/worker.min.js'
    ];

    const languageModels = [
      'public/tessdata/eng.traineddata',
      'public/tessdata/chi_sim.traineddata'
    ];

    // Check core files
    for (const file of tesseractCore) {
      await this.checkAssetFile(file, 'Tesseract core');
    }

    // Check language models
    for (const file of languageModels) {
      await this.checkAssetFile(file, 'Language model');
    }

    // Check total tessdata size
    await this.checkTessdataSize();
  }

  async checkAssetFile(filePath, type) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    try {
      const stats = await fs.stat(fullPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      this.logSuccess(`${filePath} (${sizeMB}MB) - ${type}`);
    } catch {
      this.logError(`${filePath} - missing ${type}`);
    }
  }

  async checkTessdataSize() {
    try {
      const tessdataDir = path.join(__dirname, '..', 'public/tessdata');
      const files = await fs.readdir(tessdataDir);
      
      let totalSize = 0;
      for (const file of files) {
        if (file.endsWith('.traineddata')) {
          const stats = await fs.stat(path.join(tessdataDir, file));
          totalSize += stats.size;
        }
      }

      const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
      
      if (totalSize > 10 * 1024 * 1024) { // > 10MB
        this.logSuccess(`Total tessdata: ${sizeMB}MB (${files.length} languages)`);
      } else {
        this.logWarning(`Total tessdata: ${sizeMB}MB - may need more languages`);
      }
    } catch (error) {
      this.logError(`Could not check tessdata size: ${error.message}`);
    }
  }

  async checkFontAssets() {
    console.log('\n🔍 Checking font assets...');
    
    const fontFiles = [
      'public/fonts/fonts.css'
    ];

    for (const file of fontFiles) {
      await this.checkAssetFile(file, 'Font CSS');
    }

    // Check for font files
    try {
      const fontsDir = path.join(__dirname, '..', 'public/fonts');
      const files = await fs.readdir(fontsDir);
      const fontFiles = files.filter(f => f.endsWith('.woff2') || f.endsWith('.woff'));
      
      if (fontFiles.length > 0) {
        this.logSuccess(`Font files: ${fontFiles.length} files found`);
      } else {
        this.logWarning('No .woff/.woff2 font files found');
      }
    } catch (error) {
      this.logError(`Could not check font files: ${error.message}`);
    }
  }

  async checkBuildConfiguration() {
    console.log('\n🔍 Checking build configuration...');
    
    // Check vite.config.ts
    try {
      const viteConfig = await fs.readFile(path.join(__dirname, '..', 'vite.config.ts'), 'utf8');
      
      if (viteConfig.includes('ELECTRON_BUILD')) {
        this.logSuccess('Vite config has Electron support');
      } else {
        this.logWarning('Vite config missing Electron build detection');
      }
    } catch (error) {
      this.logError(`Could not read vite.config.ts: ${error.message}`);
    }

    // Check package.json scripts
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf8'));
      
      const requiredScripts = [
        'electron:dev',
        'electron:build:win',
        'download:all',
        'setup:electron'
      ];

      for (const script of requiredScripts) {
        if (packageJson.scripts[script]) {
          this.logSuccess(`Script "${script}" configured`);
        } else {
          this.logError(`Script "${script}" missing`);
        }
      }
    } catch (error) {
      this.logError(`Could not check package.json: ${error.message}`);
    }
  }

  async checkSecurityConfiguration() {
    console.log('\n🔍 Checking security configuration...');
    
    try {
      const mainContent = await fs.readFile(path.join(__dirname, '..', 'src-electron/main.cjs'), 'utf8');
      
      const securityChecks = [
        { pattern: 'nodeIntegration: false', name: 'Node integration disabled' },
        { pattern: 'contextIsolation: true', name: 'Context isolation enabled' },
        { pattern: 'enableRemoteModule: false', name: 'Remote module disabled' },
        { pattern: 'webSecurity: true', name: 'Web security enabled' },
        { pattern: 'preload:', name: 'Preload script configured' }
      ];

      for (const check of securityChecks) {
        if (mainContent.includes(check.pattern)) {
          this.logSuccess(`Security: ${check.name}`);
        } else {
          this.logWarning(`Security: ${check.name} - NOT FOUND`);
        }
      }
    } catch (error) {
      this.logError(`Could not check security configuration: ${error.message}`);
    }
  }

  async checkDiskSpace() {
    console.log('\n🔍 Checking disk space...');
    
    try {
      // Estimate required space
      const directories = ['public/fonts', 'public/tesseract', 'public/tessdata'];
      let totalAssetSize = 0;

      for (const dir of directories) {
        try {
          const dirPath = path.join(__dirname, '..', dir);
          const files = await fs.readdir(dirPath);
          
          for (const file of files) {
            const stats = await fs.stat(path.join(dirPath, file));
            totalAssetSize += stats.size;
          }
        } catch {
          // Directory might not exist
        }
      }

      const assetSizeMB = Math.round(totalAssetSize / 1024 / 1024);
      const recommendedSpaceMB = Math.max(500, assetSizeMB * 3); // 3x for build space
      
      this.logSuccess(`Current assets: ${assetSizeMB}MB`);
      this.logSuccess(`Recommended free space: ${recommendedSpaceMB}MB`);
      
    } catch (error) {
      this.logWarning(`Could not check disk space: ${error.message}`);
    }
  }

  generateFixCommands() {
    console.log('\n🛠️  Fix Commands:');
    
    if (this.errors.some(e => e.includes('not installed'))) {
      console.log('📦 Install missing dependencies:');
      console.log('   npm install');
    }

    if (this.errors.some(e => e.includes('public/fonts')) || 
        this.warnings.some(w => w.includes('font'))) {
      console.log('🔤 Download fonts:');
      console.log('   npm run download:fonts');
    }

    if (this.errors.some(e => e.includes('tesseract')) || 
        this.warnings.some(w => w.includes('tessdata'))) {
      console.log('🔧 Download Tesseract assets:');
      console.log('   npm run download:tesseract');
    }

    if (this.errors.some(e => e.includes('tessdata')) ||
        this.warnings.some(w => w.includes('tessdata'))) {
      console.log('📚 Copy Tesseract data:');
      console.log('   npm run copy:tesseract');
    }

    if (this.errors.length > 0) {
      console.log('🚀 Run complete setup:');
      console.log('   npm run setup:electron');
    }

    console.log('\n🏗️  Development commands:');
    console.log('   npm run electron:dev        # Start development');
    console.log('   npm run electron:build:win  # Build for Windows');
    console.log('   npm run download:all        # Download all assets');
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 ELECTRON SETUP VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Verification completed in ${duration}ms`);
    console.log(`✅ Successes: ${this.successes.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Setup verification PASSED!');
      console.log('✅ Ready for Electron development and building');
    } else {
      console.log('\n⚠️  Setup verification FAILED');
      console.log('❌ Fix errors before building');
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings to address:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Critical errors:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      successes: this.successes,
      duration
    };
  }

  async runFullVerification() {
    console.log('🔍 Starting comprehensive Electron setup verification...\n');
    
    await this.checkNodeEnvironment();
    await this.checkElectronDependencies();
    await this.validateAssetStructure();
    await this.checkTesseractAssets();
    await this.checkFontAssets();
    await this.checkBuildConfiguration();
    await this.checkSecurityConfiguration();
    await this.checkDiskSpace();
    
    this.generateFixCommands();
    return this.generateReport();
  }
}

// Export for use in other scripts
export { SetupVerifier };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new SetupVerifier();
  const result = await verifier.runFullVerification();
  process.exit(result.success ? 0 : 1);
}