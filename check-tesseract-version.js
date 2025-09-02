// Quick script to check Tesseract.js version
const { createWorker } = require('tesseract.js');

console.log('🔍 Checking Tesseract.js installation...');

// Check if we can import the module
try {
  console.log('✅ Tesseract.js module loaded successfully');
  console.log('📦 Tesseract.js version from package:', require('tesseract.js/package.json').version);
  
  // Try to create a worker to verify functionality
  createWorker(['eng'], 1).then(worker => {
    console.log('✅ Worker creation successful - v6 API working');
    worker.terminate().then(() => {
      console.log('✅ Worker cleanup successful');
      console.log('🎉 Tesseract.js 6.0.1 is working correctly!');
      process.exit(0);
    });
  }).catch(error => {
    console.error('❌ Worker creation failed:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Failed to load Tesseract.js:', error.message);
  process.exit(1);
}