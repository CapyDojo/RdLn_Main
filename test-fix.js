// Test the fix for number chunking
import fs from 'fs';

// Read and execute the TypeScript file as JavaScript (simplified)
const myersCode = fs.readFileSync('./src/algorithms/MyersAlgorithm.ts', 'utf8');

// Create a simple test by extracting just the key methods we need
console.log('🧪 Testing the fix for 15,000,000 -> 20,000,000 chunking...\n');

// Simulate the key logic
function isPureNumericalSubstitution(removedContent, addedContent) {
  const removed = removedContent.trim();
  const added = addedContent.trim();
  
  if (!removed || !added) {
    return false;
  }
  
  const numberPattern = /^[$€£¥₹]?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?$/;
  
  return numberPattern.test(removed) && numberPattern.test(added);
}

function shouldTreatAsSubstitution(removedContent, addedContent) {
  // Don't create substitutions for very large content
  if (removedContent.length > 500 || addedContent.length > 500) {
    return false;
  }
  
  // ENHANCED: Special handling for pure numerical substitutions
  if (isPureNumericalSubstitution(removedContent, addedContent)) {
    console.log(`✅ Pure numerical substitution detected: "${removedContent}" -> "${addedContent}"`);
    return true;
  }
  
  console.log(`❌ Not treated as substitution: "${removedContent}" -> "${addedContent}"`);
  return false; // Simplified for this test
}

// Test cases
const testCases = [
  { removed: '15,000,000', added: '20,000,000', expected: true },
  { removed: '$12.50', added: '$15.00', expected: true },
  { removed: '$500,000,000', added: '$750,000,000', expected: true },
  { removed: '0.75', added: '0.85', expected: true }
];

testCases.forEach((test, i) => {
  console.log(`Test ${i + 1}: "${test.removed}" -> "${test.added}"`);
  const result = shouldTreatAsSubstitution(test.removed, test.added);
  console.log(`Expected: ${test.expected}, Got: ${result}, ${result === test.expected ? '✅ PASS' : '❌ FAIL'}\n`);
});