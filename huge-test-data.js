// Quick test to verify the huge test data generation
console.log('🧪 Testing huge data generation...');

const generateMassiveText = (variant) => {
  const baseTexts = [
    `ARTICLE I: DEFINITIONS AND INTERPRETATION
1.01 Definitions. For purposes of this Agreement, the following terms shall have the meanings set forth below:
"Affiliate" means, with respect to any Person, any other Person that directly or indirectly controls, is controlled by, or is under common control with, such Person.
"Agreement" means this Master Services Agreement, as it may be amended, modified or supplemented from time to time.
"Confidential Information" means all non-public, proprietary or confidential information disclosed by one Party to the other Party.
"Effective Date" means the date first written above.
"Intellectual Property Rights" means all intellectual property rights worldwide, including without limitation patents, copyrights, trademarks, trade secrets, and moral rights.
"Party" means each of Company and Service Provider, and "Parties" means both of them collectively.
"Person" means any individual, corporation, partnership, joint venture, limited liability company, governmental authority, unincorporated organization, trust, association or other entity.
"Services" means the services to be provided by Service Provider as described in the applicable Statement of Work.
"Statement of Work" or "SOW" means a written agreement executed by both Parties that describes specific Services to be performed.`,

    `ARTICLE II: SCOPE OF SERVICES
2.01 Service Provider Obligations. Subject to the terms and conditions of this Agreement, Service Provider shall provide the Services to Company in accordance with the applicable Statement of Work and any other specifications agreed upon by the Parties. Service Provider shall perform the Services in a professional and workmanlike manner in accordance with generally recognized industry standards and practices.
2.02 Company Obligations. Company shall provide Service Provider with such cooperation, information, and assistance as Service Provider may reasonably request to enable Service Provider to perform the Services effectively and efficiently.
2.03 Changes to Services. Any changes to the Services must be agreed upon in writing by both Parties through an amendment to the applicable Statement of Work.
2.04 Key Personnel. Service Provider shall assign qualified personnel to perform the Services. Any changes to key personnel assigned to perform Services shall require Company's prior written consent, which shall not be unreasonably withheld.`,

    // Add more base texts...
    `ARTICLE III: PAYMENT TERMS
3.01 Fees. In consideration for the Services, Company shall pay Service Provider the fees set forth in the applicable Statement of Work. Unless otherwise specified, all fees are due within thirty (30) days after Company's receipt of an undisputed invoice from Service Provider.
3.02 Expenses. Company shall reimburse Service Provider for all reasonable, documented, out-of-pocket expenses incurred in connection with the performance of Services, provided that such expenses have been pre-approved in writing by Company.
3.03 Taxes. Each Party shall be responsible for its own taxes arising from or relating to this Agreement and the performance of Services hereunder.
3.04 Late Payment. Any undisputed amounts not paid when due shall bear interest at the rate of one and one-half percent (1.5%) per month or the maximum rate permitted by applicable law, whichever is less.`
  ];

  // Create massive variations for each variant
  let massiveText = '';
  
  for (let section = 1; section <= 50; section++) {
    const baseIndex = section % baseTexts.length;
    const baseText = baseTexts[baseIndex];
    
    if (variant === 'original') {
      massiveText += `\n\n--- SECTION ${section} (ORIGINAL VERSION) ---\n`;
      massiveText += baseText;
      massiveText += `\n\nAdditional content for section ${section}: This section contains ${section * 100} critical provisions that must be carefully reviewed. The effective date is 2024-01-${String(section).padStart(2, '0')}. Reference number: REF-${section}-ORIG-${Math.random().toString(36).substring(7).toUpperCase()}.`;
      massiveText += `\n\nTechnical specifications: Processing time ${section * 1.5} seconds, memory allocation ${section * 256} MB, priority level ${section % 5 + 1}. Status: ACTIVE.`;
    } else {
      massiveText += `\n\n--- SECTION ${section} (REVISED VERSION) ---\n`;
      massiveText += baseText.replace(/Service Provider/g, 'Contractor').replace(/Company/g, 'Client').replace(/Agreement/g, 'Contract');
      massiveText += `\n\nModified content for section ${section}: This section contains ${section * 120} UPDATED provisions that must be carefully reviewed. The effective date is 2024-06-${String(section).padStart(2, '0')}. Reference number: REF-${section}-REV-${Math.random().toString(36).substring(7).toUpperCase()}.`;
      massiveText += `\n\nRevised specifications: Processing time ${section * 2.1} seconds, memory allocation ${section * 384} MB, priority level ${section % 5 + 3}. Status: PENDING REVIEW.`;
    }
  }

  // Add more complex patterns that will create many differences
  for (let pattern = 1; pattern <= 25; pattern++) {
    if (variant === 'original') {
      massiveText += `\n\nCOMPLEX PATTERN ${pattern}: Original data structure with values [${pattern}, ${pattern * 2}, ${pattern * 3}] and configuration settings: timeout=${pattern * 1000}ms, retries=${pattern}, batch_size=${pattern * 10}.`;
    } else {
      massiveText += `\n\nCOMPLEX PATTERN ${pattern}: Modified data structure with values [${pattern + 1}, ${(pattern + 1) * 2}, ${(pattern + 1) * 3}] and UPDATED configuration: timeout=${(pattern + 1) * 1200}ms, retries=${pattern + 2}, batch_size=${(pattern + 1) * 15}.`;
    }
  }

  return massiveText;
};

const hugeOriginal = generateMassiveText('original');
const hugeRevised = generateMassiveText('revised');

console.log('📊 HUGE TEST DATA STATS:');
console.log(`Original length: ${hugeOriginal.length.toLocaleString()} characters`);
console.log(`Revised length: ${hugeRevised.length.toLocaleString()} characters`);
console.log(`Total length: ${(hugeOriginal.length + hugeRevised.length).toLocaleString()} characters`);

// Count differences
const origWords = hugeOriginal.split(/\s+/).length;
const revWords = hugeRevised.split(/\s+/).length;
console.log(`Original words: ${origWords.toLocaleString()}`);
console.log(`Revised words: ${revWords.toLocaleString()}`);

// Show first few differences
const origLines = hugeOriginal.split('\n').slice(0, 10);
const revLines = hugeRevised.split('\n').slice(0, 10);
console.log('\n📝 First few lines comparison:');
origLines.forEach((line, i) => {
  if (line !== revLines[i]) {
    console.log(`DIFF Line ${i + 1}:`);
    console.log(`  ORIG: ${line.substring(0, 80)}...`);
    console.log(`  REV:  ${revLines[i].substring(0, 80)}...`);
  }
});

console.log('\n✅ This should definitely take 5-10+ seconds to process!');
console.log('🎯 Perfect for testing real cancellation behavior');