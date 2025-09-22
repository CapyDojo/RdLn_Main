/**
 * Enhanced Electron Build System
 * Handles multi-stage build process with asset validation and optimization
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { SetupVerifier } from './setup-verification.js';
import { AssetManager } from './asset-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ElectronBuilder {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.distDir = path.join(this.baseDir, 'dist');
    this.startTime = Date.now();
  }

  async preBuildValidation() {
    console.log('🔍 Running pre-build validation...');
    
    const verifier = new SetupVerifier();
    const result = await verifier.runFullVerification();
    
    if (!result.success) {
      throw new Error(`Pre-build validation failed with ${result.errors.length} errors`);
    }
    
    console.log('✅ Pre-build validation passed');
    return result;
  }

  async prepareAssets() {
    console.log('📦 Preparing assets for build...');
    // Ensure Tesseract core variants (SIMD/LSTM) and language files are available in public/
    try {
      execSync('npm run download:tesseract', { stdio: 'inherit', cwd: this.baseDir });
    } catch (e) {
      console.warn('⚠️  Could not download Tesseract assets automatically; proceeding with existing files');
    }

    const assetManager = new AssetManager();
    const report = await assetManager.prepareForBuild();
    
    console.log(`✅ Assets prepared: ${report.summary.totalFiles} files, ${(report.summary.totalSize / 1024 / 1024).toFixed(1)}MB`);
    return report;
  }

  async buildReactApp() {
    console.log('⚛️  Building React application...');
    
    try {
      // Set environment for Electron build
      const buildEnv = {
        ...process.env,
        ELECTRON_BUILD: 'true',
        NODE_ENV: 'production',
        REACT_APP_BUILD_TARGET: 'electron'
      };
      
      console.log('🔧 Environment variables set:');
      console.log('   ELECTRON_BUILD:', buildEnv.ELECTRON_BUILD);
      console.log('   NODE_ENV:', buildEnv.NODE_ENV);
      
      // Run Vite build
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: this.baseDir,
        env: buildEnv
      });
      
      console.log('✅ React build completed');
    } catch (error) {
      throw new Error(`React build failed: ${error.message}`);
    }
  }

  async processElectronHTML() {
    console.log('📄 Processing HTML for Electron...');
    
    try {
      execSync('npm run process:electron-html', { 
        stdio: 'inherit',
        cwd: this.baseDir 
      });
      
      console.log('✅ HTML processing completed');
    } catch (error) {
      throw new Error(`HTML processing failed: ${error.message}`);
    }
  }

  async packageElectron(platform = 'win') {
    console.log(`📦 Packaging Electron for ${platform}...`);
    
    try {
      const builderConfig = path.join(this.baseDir, 'src-electron/builder.config.cjs');
      
      // Platform-specific build commands
      const commands = {
        win: `electron-builder --win --config ${builderConfig}`,
        mac: `electron-builder --mac --config ${builderConfig}`,
        linux: `electron-builder --linux --config ${builderConfig}`,
        all: `electron-builder --config ${builderConfig}`
      };
      
      execSync(commands[platform] || commands.win, { 
        stdio: 'inherit',
        cwd: this.baseDir 
      });
      
      console.log(`✅ Electron packaging completed for ${platform}`);
    } catch (error) {
      throw new Error(`Electron packaging failed: ${error.message}`);
    }
  }

  async validateBuild() {
    console.log('🔍 Validating build output...');
    
    const distElectronDir = path.join(this.baseDir, 'dist-electron-new');
    
    try {
      const distContents = await fs.readdir(this.distDir);
      console.log(`✅ Dist directory contains ${distContents.length} items`);
      
      // Check for key build artifacts
      const requiredFiles = ['index.html', 'assets'];
      for (const file of requiredFiles) {
        await fs.access(path.join(this.distDir, file));
        console.log(`✅ Found required: ${file}`);
      }
      
      // Check Electron output
      try {
        const electronContents = await fs.readdir(distElectronDir);
        console.log(`✅ Electron output contains ${electronContents.length} items`);
      } catch {
        console.warn('⚠️  Electron output directory not found (may not have run packaging)');
      }
      
    } catch (error) {
      throw new Error(`Build validation failed: ${error.message}`);
    }
  }

  async generateBuildReport() {
    const duration = Date.now() - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration,
      status: 'success',
      assets: {},
      output: {}
    };

    try {
      // Analyze dist directory
      const distContents = await fs.readdir(this.distDir);
      report.output.distFiles = distContents.length;
      
      // Calculate sizes
      let totalSize = 0;
      for (const item of distContents) {
        try {
          const itemPath = path.join(this.distDir, item);
          const stats = await fs.stat(itemPath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        } catch {}
      }
      
      report.output.totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);
      
      // Check for Electron executables
      const distElectronDir = path.join(this.baseDir, 'dist-electron-new');
      try {
        const electronContents = await fs.readdir(distElectronDir);
        report.output.electronArtifacts = electronContents.length;
      } catch {
        report.output.electronArtifacts = 0;
      }
      
      const reportPath = path.join(this.baseDir, 'build-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n📊 Build Report:');
      console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
      console.log(`   Dist files: ${report.output.distFiles}`);
      console.log(`   Total size: ${report.output.totalSizeMB}MB`);
      console.log(`   Electron artifacts: ${report.output.electronArtifacts}`);
      
    } catch (error) {
      console.warn(`⚠️  Could not generate complete build report: ${error.message}`);
    }
    
    return report;
  }

  async buildForPlatform(platform = 'win') {
    console.log(`🚀 Starting Electron build for ${platform}...`);
    console.log(`⏱️  Build started at ${new Date().toISOString()}\n`);
    
    try {
      // Stage 1: Pre-build validation
      await this.preBuildValidation();
      
      // Stage 2: Prepare assets
      await this.prepareAssets();
      
      // Stage 3: Build React app
      await this.buildReactApp();
      
      // Stage 4: Process HTML
      await this.processElectronHTML();
      
      // Stage 5: Package Electron
      await this.packageElectron(platform);
      
      // Stage 6: Validate build
      await this.validateBuild();
      
      // Stage 7: Generate report
      const report = await this.generateBuildReport();
      
      console.log('\n🎉 Electron build completed successfully!');
      console.log('📁 Output location: dist-electron-new/');
      
      return report;
      
    } catch (error) {
      console.error(`\n❌ Build failed: ${error.message}`);
      throw error;
    }
  }
}

// Export for use in other scripts
export { ElectronBuilder };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const platform = process.argv[2] || 'win';
  const builder = new ElectronBuilder();
  
  try {
    await builder.buildForPlatform(platform);
    process.exit(0);
  } catch (error) {
    console.error('Build process failed:', error.message);
    process.exit(1);
  }
}
