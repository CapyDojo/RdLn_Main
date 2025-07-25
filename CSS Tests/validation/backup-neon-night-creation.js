/**
 * Backup Script for Neon Night Theme Creation
 * Creates backup of current state before implementing Neon Night theme
 * Following CSS Tests methodology for safe implementation
 */

console.log('🔄 BACKUP: Creating backup before Neon Night theme implementation...');

// 1. Check if neon-night.css already exists
const neonNightPath = 'src/styles/themes/neon-night.css';
const fs = require('fs');
const path = require('path');

try {
  if (fs.existsSync(neonNightPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `CSS Tests/validation/backup-neon-night-${timestamp}.css`;
    
    // Create backup
    const currentContent = fs.readFileSync(neonNightPath, 'utf8');
    fs.writeFileSync(backupPath, currentContent);
    
    console.log(`✅ BACKUP: Existing neon-night.css backed up to ${backupPath}`);
    console.log(`📊 BACKUP: File size: ${currentContent.length} characters`);
    
    // Analyze current file for comparison
    const lineCount = currentContent.split('\n').length;
    const selectorCount = (currentContent.match(/[^{}]*{[^{}]*}/g) || []).length;
    const importantCount = (currentContent.match(/!important/g) || []).length;
    
    console.log(`📈 ANALYSIS: Current file has ${lineCount} lines, ${selectorCount} selectors, ${importantCount} !important declarations`);
  } else {
    console.log('ℹ️  INFO: No existing neon-night.css found - creating new file');
  }
  
  // Verify blueprint files exist
  const kyotoPath = 'src/styles/themes/kyoto.css';
  const professionalPath = 'src/styles/themes/professional.css';
  
  if (!fs.existsSync(kyotoPath)) {
    console.error('❌ ERROR: Kyoto blueprint not found at', kyotoPath);
    process.exit(1);
  }
  
  if (!fs.existsSync(professionalPath)) {
    console.error('❌ ERROR: Professional blueprint not found at', professionalPath);
    process.exit(1);
  }
  
  console.log('✅ VERIFIED: Blueprint files (kyoto.css, professional.css) exist');
  
  // Verify theme definition exists
  const themeDefPath = 'src/themes/definitions/neon-night.ts';
  if (!fs.existsSync(themeDefPath)) {
    console.error('❌ ERROR: Neon Night theme definition not found at', themeDefPath);
    process.exit(1);
  }
  
  console.log('✅ VERIFIED: Neon Night theme definition exists');
  console.log('🚀 READY: All prerequisites met for Neon Night theme creation');
  
} catch (error) {
  console.error('❌ BACKUP ERROR:', error.message);
  process.exit(1);
}