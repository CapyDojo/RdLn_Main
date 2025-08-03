/**
 * Tauri OCR Fix Verification Script
 * 
 * This script tests the OCR functionality in a Tauri environment
 * to verify that the fixes are working correctly.
 */

console.log('🔧 Testing Tauri OCR Fix...');

// Simulate Tauri environment
if (typeof window !== 'undefined') {
  // Mock Tauri globals for testing
  window.__TAURI__ = {
    path: {
      resourceDir: async () => '/app/resources',
      join: async (...paths) => paths.join('/')
    },
    core: {
      convertFileSrc: (path) => `tauri://localhost/${path.replace(/^\//, '')}`
    }
  };
  
  // Mock location for Tauri protocol
  Object.defineProperty(window, 'location', {
    value: {
      protocol: 'tauri:',
      href: 'tauri://localhost/'
    },
    writable: true
  });
  
  console.log('✅ Tauri environment mocked successfully');
}

// Test the OCR cache manager
async function testOCRCacheManager() {
  try {
    console.log('🧪 Testing OCRCacheManager...');
    
    // Import the OCRCacheManager
    const { OCRCacheManager } = await import('./src/services/OCRCacheManager.ts');
    
    // Test Tauri detection
    console.log('🔍 Testing Tauri detection...');
    const isTauri = await OCRCacheManager.detectTauriEnvironment();
    console.log('Tauri detected:', isTauri);
    
    // Test resource path resolution
    console.log('🔍 Testing resource path resolution...');
    const resourcePaths = await OCRCacheManager.getTauriResourcePaths();
    console.log('Resource paths:', resourcePaths);
    
    // Verify paths are Tauri-compatible
    if (isTauri) {
      const expectedPrefix = 'tauri://localhost/';
      const pathsValid = [
        resourcePaths.langPath.startsWith(expectedPrefix),
        resourcePaths.workerPath.startsWith(expectedPrefix),
        resourcePaths.corePath.startsWith(expectedPrefix)
      ].every(valid => valid);
      
      if (pathsValid) {
        console.log('✅ All resource paths are Tauri-compatible');
      } else {
        console.error('❌ Some resource paths are not Tauri-compatible');
      }
    }
    
    console.log('✅ OCRCacheManager tests completed');
    
  } catch (error) {
    console.error('❌ OCRCacheManager test failed:', error);
  }
}

// Test asset availability
function testAssetAvailability() {
  console.log('🧪 Testing asset availability...');
  
  const requiredAssets = [
    '/tesseract/worker.min.js',
    '/tesseract/tesseract-core.wasm.js',
    '/tesseract/tesseract-core.wasm',
    '/tessdata/eng.traineddata'
  ];
  
  requiredAssets.forEach(asset => {
    fetch(asset)
      .then(response => {
        if (response.ok) {
          console.log(`✅ Asset available: ${asset}`);
        } else {
          console.error(`❌ Asset not available: ${asset} (${response.status})`);
        }
      })
      .catch(error => {
        console.error(`❌ Asset fetch failed: ${asset}`, error);
      });
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Tauri OCR fix verification...');
  
  await testOCRCacheManager();
  testAssetAvailability();
  
  console.log('🎉 Tauri OCR fix verification completed!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testTauriOCRFix = runTests;
  console.log('💡 Run window.testTauriOCRFix() in the browser console to test');
}

// Run automatically if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  runTests();
}