/**
 * Process Electron HTML template with correct asset references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processElectronHTML() {
  console.log('🔧 Processing Electron HTML template...');
  
  const templatePath = path.join(path.dirname(__dirname), 'src-electron', 'index-electron.template.html');
  const outputPath = path.join(path.dirname(__dirname), 'dist', 'index-electron.html');
  const distIndexPath = path.join(path.dirname(__dirname), 'dist', 'index.html');
  
  try {
    // Read the template
    const template = await fs.promises.readFile(templatePath, 'utf8');
    
    // Read the built web index.html to extract asset references
    const webIndex = await fs.promises.readFile(distIndexPath, 'utf8');
    
    // Extract JS and CSS asset references using regex
    const jsMatch = webIndex.match(/<script[^>]*src="([^"]*index-[^"]*\.js)"[^>]*>/);
    const cssMatch = webIndex.match(/<link[^>]*href="([^"]*index-[^"]*\.css)"[^>]*>/);
    
    if (!jsMatch || !cssMatch) {
      throw new Error('Could not find asset references in built index.html');
    }
    
    const jsAsset = jsMatch[1];
    const cssAsset = cssMatch[1];
    
    console.log(`📄 Found JS asset: ${jsAsset}`);
    console.log(`🎨 Found CSS asset: ${cssAsset}`);
    
    // Create asset HTML
    const assetsHTML = `    <script type="module" crossorigin src="${jsAsset}"></script>
    <link rel="stylesheet" crossorigin href="${cssAsset}">`;
    
    // Replace placeholder with actual assets
    const processedHTML = template.replace('<!-- ASSETS_PLACEHOLDER -->', assetsHTML);
    
    // Write the processed file
    await fs.promises.writeFile(outputPath, processedHTML, 'utf8');
    
    console.log(`✅ Electron HTML processed successfully: ${outputPath}`);
    console.log(`🔗 Assets injected: ${jsAsset}, ${cssAsset}`);
    
  } catch (error) {
    console.error('❌ Failed to process Electron HTML:', error);
    process.exit(1);
  }
}

// Always run when executed
processElectronHTML();