// scripts/verify-docx-integration.mjs
import { existsSync } from 'fs';
import { join } from 'path';

console.log('Verifying DOCX integration...');

// Check if required files exist
const requiredFiles = [
  'src/types/file-processing.types.ts',
  'src/services/FileTypeDetector.ts',
  'src/services/DocxProcessor.ts',
  'src/services/FileProcessingService.ts',
  'src/components/TextInputPanel.tsx',
  'src/utils/tauriFileDrop.ts'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const fullPath = join(process.cwd(), file);
  if (!existsSync(fullPath)) {
    console.error(`❌ Missing required file: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found required file: ${file}`);
  }
}

// Check if mammoth.js is installed
try {
  await import('mammoth');
  console.log('✅ mammoth.js is installed');
} catch (error) {
  console.error('❌ mammoth.js is not installed');
  allFilesExist = false;
}

// Check if test files exist
const testFiles = [
  'src/services/__tests__/FileTypeDetector.test.ts',
  'src/services/__tests__/DocxProcessor.test.ts',
  'src/services/__tests__/FileProcessingService.integration.test.ts'
];

for (const file of testFiles) {
  const fullPath = join(process.cwd(), file);
  if (!existsSync(fullPath)) {
    console.error(`❌ Missing test file: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found test file: ${file}`);
  }
}

// Check if documentation exists
const docsFile = 'docs/DOCX_Input_Support_Documentation.md';
const docsPath = join(process.cwd(), docsFile);
if (!existsSync(docsPath)) {
  console.error(`❌ Missing documentation file: ${docsFile}`);
  allFilesExist = false;
} else {
  console.log(`✅ Found documentation file: ${docsFile}`);
}

// Check if test DOCX file exists
const testDocxFile = 'src/assets/test-document.docx';
const testDocxPath = join(process.cwd(), testDocxFile);
if (!existsSync(testDocxPath)) {
  console.error(`❌ Missing test DOCX file: ${testDocxFile}`);
  allFilesExist = false;
} else {
  console.log(`✅ Found test DOCX file: ${testDocxFile}`);
}

if (allFilesExist) {
  console.log('\n🎉 All DOCX integration files are in place!');
  console.log('The integration is ready for testing.');
} else {
  console.log('\n❌ Some files are missing. Please check the installation.');
  process.exit(1);
}