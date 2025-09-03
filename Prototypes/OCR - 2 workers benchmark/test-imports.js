/**
 * Test script to verify OCR function imports
 * This script tests if we can import the OCR functions from the SimpleOCRCache module
 */

// This would be run in the browser context through the Vite dev server
console.log('Testing OCR function imports...');

// We'll test the import when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Attempting to import SimpleOCRCache...');
        const module = await import('../../src/services/SimpleOCRCache.ts');
        console.log('Successfully imported SimpleOCRCache module:', Object.keys(module));
        
        // Check if the expected functions are available
        if (module.prewarmLanguageWorker) {
            console.log('✅ prewarmLanguageWorker function is available');
        } else {
            console.log('❌ prewarmLanguageWorker function is NOT available');
        }
        
        if (module.extractTextWithPrewarmedWorker) {
            console.log('✅ extractTextWithPrewarmedWorker function is available');
        } else {
            console.log('❌ extractTextWithPrewarmedWorker function is NOT available');
        }
        
        console.log('OCR function import test completed successfully');
    } catch (error) {
        console.error('Error importing OCR functions:', error);
    }
});