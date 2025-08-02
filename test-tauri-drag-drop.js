// Test script for Tauri drag and drop functionality
// Run this in the browser console after building and running the Tauri app

console.log('🧪 Testing Tauri drag and drop functionality...');

// Check if we're running in Tauri
const isTauri = window.__TAURI__ !== undefined;
console.log('🔍 Running in Tauri:', isTauri);

if (isTauri) {
  console.log('✅ Tauri environment detected');
  console.log('📦 Available Tauri APIs:', Object.keys(window.__TAURI__));
  
  // Check if file system API is available
  if (window.__TAURI__.fs) {
    console.log('✅ File system API available');
  } else {
    console.log('❌ File system API not available');
  }
  
  // Check if event API is available
  if (window.__TAURI__.event) {
    console.log('✅ Event API available');
  } else {
    console.log('❌ Event API not available');
  }
} else {
  console.log('❌ Not running in Tauri environment');
  console.log('💡 To test drag and drop:');
  console.log('1. Build the Tauri app: npm run tauri build');
  console.log('2. Or run in dev mode: npm run tauri dev');
  console.log('3. Drag a PNG file onto the input panel');
}

// Test HTML5 drag and drop as fallback
console.log('🧪 Testing HTML5 drag and drop support...');
const textareas = document.querySelectorAll('textarea');
if (textareas.length > 0) {
  console.log(`✅ Found ${textareas.length} textarea elements`);
  textareas.forEach((textarea, index) => {
    console.log(`📝 Textarea ${index + 1}:`, {
      hasDropHandler: textarea.ondrop !== null,
      hasDragOverHandler: textarea.ondragover !== null,
      className: textarea.className
    });
  });
} else {
  console.log('❌ No textarea elements found');
}

console.log('🎯 Test complete. Try dragging a PNG file onto the input panels.');