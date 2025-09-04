// Test imports to verify they work correctly
import { createWorker } from 'tesseract.js';
import { getResourcePaths, getTesseractConfig } from '../../src/config/pathConfig';

console.log('✅ All imports successful');
console.log('✅ Tesseract.js version:', createWorker);
console.log('✅ Path config functions available');