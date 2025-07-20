// Test the regex pattern from isPureNumericalSubstitution
console.log('🧪 Testing number regex pattern...\n');

const numberPattern = /^[$€£¥₹]?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?$/;

const testCases = [
  '15,000,000',
  '20,000,000', 
  '$12.50',
  '$15.00',
  '$500,000,000',
  '$750,000,000',
  '0.75',
  '0.85'
];

testCases.forEach(test => {
  const matches = numberPattern.test(test);
  console.log(`"${test}" matches: ${matches}`);
});

console.log('\nAnalyzing the pattern:');
console.log('Pattern: /^[$€£¥₹]?\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?%?$/');
console.log('- ^[$€£¥₹]? : Optional currency symbol at start');
console.log('- \\d{1,3} : 1-3 digits (this is the problem!)');
console.log('- (?:,\\d{3})* : Zero or more groups of comma + 3 digits');
console.log('- (?:\\.\\d+)? : Optional decimal part');
console.log('- %? : Optional percentage');
console.log('- $ : End of string');

console.log('\nThe issue: \\d{1,3} means the first part can only be 1-3 digits');
console.log('But 15,000,000 starts with "15" (2 digits) - should work');
console.log('Let me check what\'s actually happening...');

// Let's break down 15,000,000
const test = '15,000,000';
console.log(`\nBreaking down "${test}":`);
console.log('- Starts with currency? No');
console.log('- First 1-3 digits: "15" ✓');
console.log('- Followed by ",000"? ✓');
console.log('- Followed by ",000"? ✓');
console.log('- No decimal part');
console.log('- No percentage');
console.log('- End of string ✓');

// Let's test step by step
const parts = [
  /^[$€£¥₹]?/.test(test),
  /^\d{1,3}/.test(test.replace(/^[$€£¥₹]?/, '')),
  /^(?:,\d{3})*/.test(test.replace(/^[$€£¥₹]?\d{1,3}/, '')),
];

console.log('Step by step test:');
console.log('Currency part:', parts[0]);
console.log('After removing currency, starts with 1-3 digits:', /^\d{1,3}/.test(test));
console.log('After removing first digits, comma groups:', /^(?:,\d{3})*$/.test(',000,000'));

// The real test
console.log('\nFull pattern test on parts:');
const withoutCurrency = test; // no currency
console.log('Without currency:', withoutCurrency);
const firstDigits = withoutCurrency.match(/^\d{1,3}/);
console.log('First 1-3 digits:', firstDigits);
const afterFirstDigits = withoutCurrency.replace(/^\d{1,3}/, '');
console.log('After first digits:', afterFirstDigits);
const commaGroups = afterFirstDigits.match(/^(?:,\d{3})*/);
console.log('Comma groups match:', commaGroups);