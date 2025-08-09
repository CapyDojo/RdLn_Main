import { MyersAlgorithm } from '../algorithms/MyersAlgorithm';
import { DEV_CONFIG } from '../config/appConfig';

// Test cases that previously had boundary fragment issues
const TEST_CASES = [
  {
    original: "Company",
    revised: "Corporation",
    description: "Company → Corporation (prefix issue)"
  },
  {
    original: "Contractor",
    revised: "Service Provider",
    description: "Contractor → Service Provider (suffix issue)"
  }
];

// Function to check for boundary fragments
const hasBoundaryFragments = (changes: any[]) => {
  return changes.some(change => 
    (change.type === 'unchanged' && change.content && change.content.length < 3) ||
    (change.type === 'changed' && 
     ((change.originalContent && change.originalContent.length < 3) || 
      (change.revisedContent && change.revisedContent.length < 3)))
  );
};

// Run tests and log results
export async function runBoundaryTests() {
  if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log("=== BOUNDARY FRAGMENT FIX TEST ===");
  
  for (const test of TEST_CASES) {
    if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log(`\nTest: ${test.description}`);
    if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log(`Original: "${test.original}"`);
    if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log(`Revised: "${test.revised}"`);
    
    // Run the diff algorithm
    const result = await MyersAlgorithm.compare(test.original, test.revised);
    
    // Check for boundary fragments
    const foundBoundaryFragments = hasBoundaryFragments(result.changes);
    
    if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) {
      console.log("\nDiff changes:");
      result.changes.forEach((change, i) => {
        console.log(`Change ${i+1}:`, JSON.stringify(change));
      });
    }
    
    if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log("\nResult:", foundBoundaryFragments ? "❌ Has boundary fragments" : "✅ No boundary fragments");
    if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log("-".repeat(50));
  }
  
  if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log("\nTest completed!");
}

// Auto-run the tests when this module is imported
if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) {
  runBoundaryTests();
}