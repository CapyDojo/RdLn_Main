// Test script to verify number chunking fix
import { MyersAlgorithm } from './src/algorithms/MyersAlgorithm.ts';

async function testNumberChunking() {
  console.log('🧪 Testing number chunking improvements...\n');
  
  // Test case 1: The problematic case from the image
  const original1 = "15,000,000 shares of Parent Common Stock.";
  const revised1 = "20,000,000 shares of Parent Common Stock.";
  
  console.log('Test 1: Large number substitution');
  console.log('Original:', original1);
  console.log('Revised:', revised1);
  
  try {
    const result1 = await MyersAlgorithm.compare(original1, revised1);
    console.log('Changes:', result1.changes.length);
    result1.changes.forEach((change, i) => {
      if (change.type !== 'unchanged') {
        console.log(`  ${i}: ${change.type} - "${change.content || change.originalContent + ' -> ' + change.revisedContent}"`);
      }
    });
  } catch (error) {
    console.error('Error in test 1:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test case 2: Currency (should still work)
  const original2 = "The price is $12.50 per share.";
  const revised2 = "The price is $15.00 per share.";
  
  console.log('Test 2: Currency substitution (should still work)');
  console.log('Original:', original2);
  console.log('Revised:', revised2);
  
  try {
    const result2 = await MyersAlgorithm.compare(original2, revised2);
    console.log('Changes:', result2.changes.length);
    result2.changes.forEach((change, i) => {
      if (change.type !== 'unchanged') {
        console.log(`  ${i}: ${change.type} - "${change.content || change.originalContent + ' -> ' + change.revisedContent}"`);
      }
    });
  } catch (error) {
    console.error('Error in test 2:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test case 3: Large currency (should still work)
  const original3 = "not exceed $500,000,000 in cash";
  const revised3 = "not exceed $750,000,000 in cash";
  
  console.log('Test 3: Large currency substitution (should still work)');
  console.log('Original:', original3);
  console.log('Revised:', revised3);
  
  try {
    const result3 = await MyersAlgorithm.compare(original3, revised3);
    console.log('Changes:', result3.changes.length);
    result3.changes.forEach((change, i) => {
      if (change.type !== 'unchanged') {
        console.log(`  ${i}: ${change.type} - "${change.content || change.originalContent + ' -> ' + change.revisedContent}"`);
      }
    });
  } catch (error) {
    console.error('Error in test 3:', error.message);
  }
}

testNumberChunking().catch(console.error);