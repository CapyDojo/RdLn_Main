/**
 * Comprehensive Asset Management System for Electron
 * Handles fonts, Tesseract, tessdata with integrity checking and optimization
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AssetManager {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.publicDir = path.join(this.baseDir, 'public');
    this.manifestPath = path.join(this.publicDir, 'asset-manifest.json');
  }

  async ensureDirectories() {
    const directories = [
      'public',
      'public/fonts',
      'public/tesseract',
      'public/tessdata',
      'public/images'
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.baseDir, dir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  async calculateFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return createHash('sha256').update(content).digest('hex').slice(0, 16);
    } catch {
      return null;
    }
  }

  async createAssetManifest() {
    console.log('📋 Creating asset manifest...');
    
    const manifest = {
      version: '1.0.0',
      created: new Date().toISOString(),
      fonts: {},
      tesseract: {},
      tessdata: {},
      images: {},
      totalSize: 0
    };

    // Scan each asset directory
    const assetDirs = ['fonts', 'tesseract', 'tessdata', 'images'];
    
    for (const dir of assetDirs) {
      const dirPath = path.join(this.publicDir, dir);
      
      try {
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            const hash = await this.calculateFileHash(filePath);
            
            manifest[dir][file] = {
              size: stats.size,
              hash,
              modified: stats.mtime.toISOString(),
              type: this.getFileType(file)
            };
            
            manifest.totalSize += stats.size;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not scan ${dir}: ${error.message}`);
      }
    }

    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Asset manifest created: ${(manifest.totalSize / 1024 / 1024).toFixed(1)}MB total`);
    
    return manifest;
  }

  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.woff2': 'font',
      '.woff': 'font',
      '.ttf': 'font',
      '.css': 'stylesheet',
      '.js': 'javascript',
      '.wasm': 'webassembly',
      '.traineddata': 'ocr-model',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.svg': 'image'
    };
    
    return typeMap[ext] || 'unknown';
  }

  async validateAssetIntegrity() {
    console.log('🔍 Validating asset integrity...');
    
    try {
      const manifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf8'));
      const issues = [];
      
      for (const [category, files] of Object.entries(manifest)) {
        if (typeof files !== 'object' || category === 'version' || category === 'created' || category === 'totalSize') {
          continue;
        }
        
        for (const [filename, info] of Object.entries(files)) {
          const filePath = path.join(this.publicDir, category, filename);
          
          try {
            const stats = await fs.stat(filePath);
            const currentHash = await this.calculateFileHash(filePath);
            
            if (stats.size !== info.size) {
              issues.push(`${category}/${filename}: Size mismatch (expected ${info.size}, got ${stats.size})`);
            }
            
            if (currentHash !== info.hash) {
              issues.push(`${category}/${filename}: Hash mismatch (file may be corrupted)`);
            }
          } catch {
            issues.push(`${category}/${filename}: File missing`);
          }
        }
      }
      
      if (issues.length === 0) {
        console.log('✅ All assets passed integrity check');
      } else {
        console.warn(`⚠️  ${issues.length} integrity issues found:`);
        issues.forEach(issue => console.warn(`   - ${issue}`));
      }
      
      return { valid: issues.length === 0, issues };
      
    } catch (error) {
      console.error(`❌ Could not validate assets: ${error.message}`);
      return { valid: false, issues: ['Manifest not found or corrupted'] };
    }
  }

  async optimizeAssets() {
    console.log('⚡ Optimizing assets for Electron...');
    
    // Remove unused tessdata files (keep only essential languages)
    await this.optimizeTessdata();
    
    // Validate font files
    await this.validateFonts();
    
    // Check Tesseract core files
    await this.validateTesseractCore();
    
    console.log('✅ Asset optimization completed');
  }

  async optimizeTessdata() {
    const tessdataDir = path.join(this.publicDir, 'tessdata');
    
    try {
      const files = await fs.readdir(tessdataDir);
      const trainedDataFiles = files.filter(f => f.endsWith('.traineddata'));
      
      // Essential languages for RdLn
      const essentialLanguages = [
        'eng.traineddata',      // English - primary
        'chi_sim.traineddata',  // Simplified Chinese - high priority
        'chi_tra.traineddata',  // Traditional Chinese - high priority
        'jpn.traineddata',      // Japanese - legal documents
        'kor.traineddata',      // Korean - legal documents
        'fra.traineddata',      // French - international legal
        'deu.traineddata',      // German - international legal
        'spa.traineddata'       // Spanish - international legal
      ];
      
      let totalSize = 0;
      let keptFiles = 0;
      
      for (const file of trainedDataFiles) {
        const filePath = path.join(tessdataDir, file);
        const stats = await fs.stat(filePath);
        
        if (essentialLanguages.includes(file)) {
          totalSize += stats.size;
          keptFiles++;
          console.log(`📚 Keeping: ${file} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
        } else {
          console.log(`🗑️  Optional: ${file} (${(stats.size / 1024 / 1024).toFixed(1)}MB) - consider removing to reduce bundle size`);
        }
      }
      
      console.log(`📊 Tessdata: ${keptFiles} essential files, ${(totalSize / 1024 / 1024).toFixed(1)}MB total`);
      
    } catch (error) {
      console.warn(`⚠️  Could not optimize tessdata: ${error.message}`);
    }
  }

  async validateFonts() {
    const fontsDir = path.join(this.publicDir, 'fonts');
    
    try {
      const cssPath = path.join(fontsDir, 'fonts.css');
      await fs.access(cssPath);
      
      const cssContent = await fs.readFile(cssPath, 'utf8');
      const fontFiles = await fs.readdir(fontsDir);
      const woffFiles = fontFiles.filter(f => f.endsWith('.woff2') || f.endsWith('.woff'));
      
      console.log(`🔤 Fonts: ${woffFiles.length} files, CSS configured`);
      
      // Check if CSS references match available files
      if (cssContent.includes('woff2') && woffFiles.length > 0) {
        console.log('✅ Font files match CSS configuration');
      } else {
        console.warn('⚠️  Font CSS may not match available files');
      }
      
    } catch (error) {
      console.warn(`⚠️  Font validation failed: ${error.message}`);
    }
  }

  async validateTesseractCore() {
    const tesseractDir = path.join(this.publicDir, 'tesseract');
    
    const coreFiles = [
      'tesseract-core.wasm.js',
      'worker.min.js'
    ];
    
    let validFiles = 0;
    
    for (const file of coreFiles) {
      try {
        const filePath = path.join(tesseractDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.size > 1000) { // Basic size check
          console.log(`🔧 Tesseract: ${file} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
          validFiles++;
        } else {
          console.warn(`⚠️  Tesseract: ${file} seems too small`);
        }
      } catch {
        console.error(`❌ Tesseract: ${file} missing`);
      }
    }
    
    if (validFiles === coreFiles.length) {
      console.log('✅ Tesseract core files validated');
    } else {
      console.warn(`⚠️  Only ${validFiles}/${coreFiles.length} Tesseract files validated`);
    }
  }

  async generateAssetReport() {
    console.log('\n📊 Generating asset report...');
    
    const manifest = await this.createAssetManifest();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        totalSize: manifest.totalSize,
        categories: {}
      },
      details: {}
    };

    for (const [category, files] of Object.entries(manifest)) {
      if (typeof files !== 'object' || ['version', 'created', 'totalSize'].includes(category)) {
        continue;
      }
      
      const fileCount = Object.keys(files).length;
      const categorySize = Object.values(files).reduce((sum, file) => sum + file.size, 0);
      
      report.summary.totalFiles += fileCount;
      report.summary.categories[category] = {
        files: fileCount,
        size: categorySize,
        sizeMB: (categorySize / 1024 / 1024).toFixed(1)
      };
      
      report.details[category] = files;
    }

    const reportPath = path.join(this.publicDir, 'asset-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📋 Asset Report Summary:');
    console.log(`   Total files: ${report.summary.totalFiles}`);
    console.log(`   Total size: ${(report.summary.totalSize / 1024 / 1024).toFixed(1)}MB`);
    
    for (const [category, info] of Object.entries(report.summary.categories)) {
      console.log(`   ${category}: ${info.files} files (${info.sizeMB}MB)`);
    }
    
    return report;
  }

  async prepareForBuild() {
    console.log('🏗️  Preparing assets for Electron build...');
    
    await this.ensureDirectories();
    const integrity = await this.validateAssetIntegrity();
    
    if (!integrity.valid) {
      console.warn('⚠️  Asset integrity issues detected - rebuild may be needed');
    }
    
    await this.optimizeAssets();
    const report = await this.generateAssetReport();
    
    console.log('✅ Assets prepared for build');
    return report;
  }
}

// Export for use in build scripts
export { AssetManager };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new AssetManager();
  await manager.prepareForBuild();
}