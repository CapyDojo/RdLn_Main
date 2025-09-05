/**
 * Download all Tesseract.js assets for offline bundling
 * Downloads core files and additional language files not already present
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Align core assets with tesseract.js v6.x used in package.json
const CORE_VER = '6.0.1';
const JS_VER = '6.0.1';

// Tesseract.js core assets (include .wasm and .wasm.js wrappers)
const TESSERACT_CORE_ASSETS = {
  'tesseract-core.wasm.js': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core.wasm.js`,
  'tesseract-core.wasm': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core.wasm`,
  'tesseract-core-simd.wasm.js': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core-simd.wasm.js`,
  'tesseract-core-simd.wasm': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core-simd.wasm`,
  'tesseract-core-lstm.wasm.js': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core-lstm.wasm.js`,
  'tesseract-core-lstm.wasm': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core-lstm.wasm`,
  'tesseract-core-simd-lstm.wasm.js': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core-simd-lstm.wasm.js`,
  'tesseract-core-simd-lstm.wasm': `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VER}/tesseract-core-simd-lstm.wasm`,
  'worker.min.js': `https://cdn.jsdelivr.net/npm/tesseract.js@${JS_VER}/dist/worker.min.js`
};

// Additional language files (beyond what's already in public/tessdata)
const ADDITIONAL_LANGUAGES = {
  // European languages
  'ita.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/ita.traineddata',
  'por.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/por.traineddata',
  'nld.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/nld.traineddata',
  'pol.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/pol.traineddata',
  'swe.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/swe.traineddata',
  'nor.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/nor.traineddata',
  'dan.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/dan.traineddata',
  'fin.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/fin.traineddata',
  'ces.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/ces.traineddata',
  'hun.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/hun.traineddata',
  
  // Asian languages
  'tha.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/tha.traineddata',
  'vie.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/vie.traineddata',
  'hin.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/hin.traineddata',
  'ben.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/ben.traineddata',
  'tam.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/tam.traineddata',
  'tel.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/tel.traineddata',
  'kan.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/kan.traineddata',
  'mal.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/mal.traineddata',
  
  // Middle Eastern languages
  'heb.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/heb.traineddata',
  'tur.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/tur.traineddata',
  'per.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/per.traineddata',
  'urd.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/urd.traineddata',
  
  // African languages
  'afr.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/afr.traineddata',
  'swa.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/swa.traineddata',
  
  // Latin script variants
  'lat.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/lat.traineddata',
  'equ.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/equ.traineddata', // Math/equations
  
  // Additional Chinese variants
  'chi_sim_vert.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/chi_sim_vert.traineddata',
  'chi_tra_vert.traineddata': 'https://tessdata.projectnaptha.com/4.0.0/chi_tra_vert.traineddata'
};

const CORE_OUTPUT_DIR = path.join(__dirname, '../public/tesseract');
const TESSDATA_OUTPUT_DIR = path.join(__dirname, '../public/tessdata');

// Download file from URL
function downloadFile(url, outputPath) {
  return new Promise(async (resolve, reject) => {
    console.log(`  📄 Downloading: ${path.basename(outputPath)}`);
    
    const fsSync = await import('fs');
    const file = fsSync.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage} for ${url}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'] || '0');
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize > 0) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\\r    Progress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        process.stdout.write('\\n');
        console.log(`    ✅ Downloaded: ${path.basename(outputPath)}`);
        resolve();
      });
      
      file.on('error', async (error) => {
        try {
          await fs.unlink(outputPath);
        } catch {}
        reject(error);
      });
    }).on('error', reject);
  });
}

// Check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Ensure output directories exist
async function ensureOutputDirs() {
  try {
    await fs.mkdir(CORE_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(TESSDATA_OUTPUT_DIR, { recursive: true });
    console.log(`📁 Output directories ready`);
  } catch (error) {
    console.error('Failed to create output directories:', error);
    throw error;
  }
}

// Download Tesseract core files
async function downloadCoreFiles() {
  console.log('\\n🔧 Downloading Tesseract core files...');
  
  for (const [fileName, url] of Object.entries(TESSERACT_CORE_ASSETS)) {
    const outputPath = path.join(CORE_OUTPUT_DIR, fileName);
    
    if (await fileExists(outputPath)) {
      console.log(`  ⏭️  Skipping ${fileName} (already exists)`);
      continue;
    }
    
    try {
      await downloadFile(url, outputPath);
    } catch (error) {
      console.error(`  ❌ Failed to download ${fileName}:`, error.message);
    }
  }
}

// Download additional language files
async function downloadLanguageFiles() {
  console.log('\\n🌍 Downloading additional language files...');
  
  for (const [fileName, url] of Object.entries(ADDITIONAL_LANGUAGES)) {
    const outputPath = path.join(TESSDATA_OUTPUT_DIR, fileName);
    
    if (await fileExists(outputPath)) {
      console.log(`  ⏭️  Skipping ${fileName} (already exists)`);
      continue;
    }
    
    try {
      await downloadFile(url, outputPath);
    } catch (error) {
      console.error(`  ❌ Failed to download ${fileName}:`, error.message);
    }
  }
}

// Create summary report
async function createSummaryReport() {
  console.log('\\n📊 Creating download summary...');
  
  try {
    const coreFiles = await fs.readdir(CORE_OUTPUT_DIR);
    const langFiles = await fs.readdir(TESSDATA_OUTPUT_DIR);
    
    // Calculate total size
    let totalSize = 0;
    for (const file of coreFiles) {
      const stats = await fs.stat(path.join(CORE_OUTPUT_DIR, file));
      totalSize += stats.size;
    }
    for (const file of langFiles) {
      const stats = await fs.stat(path.join(TESSDATA_OUTPUT_DIR, file));
      totalSize += stats.size;
    }
    
    const report = {
      downloadDate: new Date().toISOString(),
      coreFiles: coreFiles.length,
      languageFiles: langFiles.length,
      totalFiles: coreFiles.length + langFiles.length,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(1),
      coreFilesList: coreFiles,
      languageFilesList: langFiles
    };
    
    await fs.writeFile(
      path.join(__dirname, '../public/tesseract-download-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\\n✅ Download Summary:`);
    console.log(`   📦 Core files: ${report.coreFiles}`);
    console.log(`   🌍 Language files: ${report.languageFiles}`);
    console.log(`   📊 Total size: ${report.totalSizeMB}MB`);
    console.log(`   📄 Report saved: tesseract-download-report.json`);
    
  } catch (error) {
    console.error('Failed to create summary report:', error);
  }
}

// Main function
async function downloadTesseractAssets() {
  console.log('🚀 Starting Tesseract assets download...');
  
  try {
    await ensureOutputDirs();
    await downloadCoreFiles();
    await downloadLanguageFiles();
    await createSummaryReport();
    
    console.log('\\n🎉 Tesseract assets download completed successfully!');
    console.log('\\n🔧 Next steps:');
    console.log('1. Configure Tesseract.js to use local assets');
    console.log('2. Update Electron builder to include tesseract directories');
    console.log('3. Test OCR functionality offline');
    
  } catch (error) {
    console.error('❌ Tesseract assets download failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadTesseractAssets();
}

export { downloadTesseractAssets };
