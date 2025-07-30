// Quick test of bilingual text
import { formatPastedText } from './src/utils/paragraphFormatting.js';

const input = `saction with the
Company (a "Transaction"), you have requested certain information concerning the Company, its
affiliates and/or the Transaction from the Company's directors, officers, employees,
representatives and/or agents (including without limitation, attorneys, accountants, consultants and
financial advisors) (the Company's "Representatives"). All such information furnished to you or
your Representatives (as defined below) by or on behalf of the Company, irrespective of the form`;

console.log('=== INPUT ===');
console.log(input);
console.log('\n=== OUTPUT ===');
console.log(formatPastedText(input));