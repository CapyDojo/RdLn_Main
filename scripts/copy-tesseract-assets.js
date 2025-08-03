#!/usr/bin/env node

/**
 * Copy Tesseract Assets Script
 * 
 * Ensures Tesseract.js assets are properly copied to the public directory
 * for both web and Tauri builds.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'node_modules', 'tesseract.js', 'dist');
const publicTargetDir = path.join(__dirname, '..', 'public', 'tesseract');
const tauriTargetDir = path.join(__dirname, '..', 'src-tauri', 'tesseract');

// Ensure target directories exist
if (!fs.existsSync(publicTargetDir)) {
  fs.mkdirSync(publicTargetDir, { recursive: true });
}
if (!fs.existsSync(tauriTargetDir)) {
  fs.mkdirSync(tauriTargetDir, { recursive: true });
}

// Files to copy from node_modules
const filesToCopy = [
  'worker.min.js'
];

// Files that should exist in public directory (may be pre-downloaded)
const requiredFiles = [
  'worker.min.js',
  'tesseract-core.wasm',
  'tesseract-core.wasm.js'
];

console.log('📦 Copying Tesseract.js assets...');

// Copy available files from node_modules to both directories
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const publicTargetPath = path.join(publicTargetDir, file);
  const tauriTargetPath = path.join(tauriTargetDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, publicTargetPath);
    fs.copyFileSync(sourcePath, tauriTargetPath);
    console.log(`✅ Copied ${file} from node_modules to both public and src-tauri`);
  } else {
    console.warn(`⚠️ Source file not found: ${sourcePath}`);
  }
});

// Copy existing WASM files from public to src-tauri if they don't exist there
const wasmFiles = ['tesseract-core.wasm', 'tesseract-core.wasm.js'];
wasmFiles.forEach(file => {
  const publicPath = path.join(publicTargetDir, file);
  const tauriPath = path.join(tauriTargetDir, file);
  
  if (fs.existsSync(publicPath) && !fs.existsSync(tauriPath)) {
    fs.copyFileSync(publicPath, tauriPath);
    console.log(`✅ Copied ${file} from public to src-tauri`);
  }
});

// Verify all required files exist in both directories
console.log('🔍 Verifying required assets...');
let allFilesPresent = true;

requiredFiles.forEach(file => {
  const publicPath = path.join(publicTargetDir, file);
  const tauriPath = path.join(tauriTargetDir, file);
  
  if (fs.existsSync(publicPath)) {
    console.log(`✅ Verified ${file} exists in public`);
  } else {
    console.error(`❌ Required file missing in public: ${publicPath}`);
    allFilesPresent = false;
  }
  
  if (fs.existsSync(tauriPath)) {
    console.log(`✅ Verified ${file} exists in src-tauri`);
  } else {
    console.error(`❌ Required file missing in src-tauri: ${tauriPath}`);
    allFilesPresent = false;
  }
});

if (allFilesPresent) {
  console.log('🎉 All Tesseract.js assets are ready for both web and Tauri builds!');
} else {
  console.error('❌ Some required assets are missing. Please ensure all Tesseract.js files are in both public/tesseract/ and src-tauri/tesseract/');
  process.exit(1);
}