/**
 * Download Google Fonts for offline bundling
 * Downloads all fonts referenced in index.html for complete offline functionality
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Font configurations
const FONTS_CONFIG = {
  // Google Fonts API URLs
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'Crimson Text': 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap',
  'Libre Baskerville': 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
};

// CDN Fonts
const CDN_FONTS = {
  'Libertinus Math': 'https://fonts.cdnfonts.com/css/libertinus-math'
};

const OUTPUT_DIR = path.join(__dirname, '../public/fonts');
const CSS_OUTPUT = path.join(OUTPUT_DIR, 'fonts.css');

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created fonts directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Failed to create fonts directory:', error);
    throw error;
  }
}

// Download file from URL
function downloadFile(url, outputPath) {
  return new Promise(async (resolve, reject) => {
    const fsSync = await import('fs');
    const file = fsSync.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
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

// Fetch CSS and extract font URLs
async function fetchCSSAndExtractUrls(cssUrl) {
  return new Promise((resolve, reject) => {
    https.get(cssUrl, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        // Extract URLs from CSS
        const urlMatches = data.match(/url\\(([^)]+)\\)/g) || [];
        const urls = urlMatches.map(match => 
          match.replace(/url\\((['"']?)([^'"]+)\\1\\)/, '$2')
        );
        
        resolve({ css: data, urls });
      });
    }).on('error', reject);
  });
}

// Process Google Fonts
async function processGoogleFonts() {
  console.log('🔍 Processing Google Fonts...');
  let combinedCSS = '/* Google Fonts - Local Bundle */\\n\\n';
  
  for (const [fontName, cssUrl] of Object.entries(FONTS_CONFIG)) {
    console.log(`📥 Downloading ${fontName}...`);
    
    try {
      const { css, urls } = await fetchCSSAndExtractUrls(cssUrl);
      
      // Download each font file
      const localUrls = [];
      for (let i = 0; i < urls.length; i++) {
        const fontUrl = urls[i];
        const extension = path.extname(fontUrl).split('?')[0] || '.woff2';
        const fileName = `${fontName.toLowerCase().replace(/\\s+/g, '-')}-${i}${extension}`;
        const localPath = path.join(OUTPUT_DIR, fileName);
        
        console.log(`  📄 Downloading font file: ${fileName}`);
        await downloadFile(fontUrl, localPath);
        localUrls.push(`./fonts/${fileName}`);
      }
      
      // Replace URLs in CSS
      let localCSS = css;
      urls.forEach((originalUrl, index) => {
        localCSS = localCSS.replace(originalUrl, localUrls[index]);
      });
      
      combinedCSS += `/* ${fontName} */\\n${localCSS}\\n\\n`;
      console.log(`✅ ${fontName} downloaded successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to download ${fontName}:`, error);
    }
  }
  
  return combinedCSS;
}

// Process CDN Fonts
async function processCDNFonts() {
  console.log('🔍 Processing CDN Fonts...');
  let cdnCSS = '/* CDN Fonts - Local Bundle */\\n\\n';
  
  for (const [fontName, cssUrl] of Object.entries(CDN_FONTS)) {
    console.log(`📥 Downloading ${fontName}...`);
    
    try {
      const { css, urls } = await fetchCSSAndExtractUrls(cssUrl);
      
      // Download each font file
      const localUrls = [];
      for (let i = 0; i < urls.length; i++) {
        const fontUrl = urls[i];
        const extension = path.extname(fontUrl).split('?')[0] || '.woff2';
        const fileName = `${fontName.toLowerCase().replace(/\\s+/g, '-')}-${i}${extension}`;
        const localPath = path.join(OUTPUT_DIR, fileName);
        
        console.log(`  📄 Downloading font file: ${fileName}`);
        await downloadFile(fontUrl, localPath);
        localUrls.push(`./fonts/${fileName}`);
      }
      
      // Replace URLs in CSS
      let localCSS = css;
      urls.forEach((originalUrl, index) => {
        localCSS = localCSS.replace(originalUrl, localUrls[index]);
      });
      
      cdnCSS += `/* ${fontName} */\\n${localCSS}\\n\\n`;
      console.log(`✅ ${fontName} downloaded successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to download ${fontName}:`, error);
    }
  }
  
  return cdnCSS;
}

// Main function
async function downloadFonts() {
  console.log('🚀 Starting font download process...');
  
  try {
    await ensureOutputDir();
    
    const googleCSS = await processGoogleFonts();
    const cdnCSS = await processCDNFonts();
    
    // Combine all CSS
    const finalCSS = `${googleCSS}${cdnCSS}`;
    
    // Write combined CSS file
    await fs.writeFile(CSS_OUTPUT, finalCSS);
    console.log(`📝 Combined CSS written to: ${CSS_OUTPUT}`);
    
    console.log('\\n✅ Font download completed successfully!');
    console.log(`📊 Total files downloaded: Check ${OUTPUT_DIR}`);
    console.log('\\n🔧 Next steps:');
    console.log('1. Update index.html to use local fonts instead of CDN');
    console.log('2. Configure Electron builder to include fonts directory');
    
  } catch (error) {
    console.error('❌ Font download failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadFonts();
}

export { downloadFonts };