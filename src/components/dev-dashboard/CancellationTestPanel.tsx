import React, { useState } from 'react';
import { useComparison } from '../../hooks/useComparison';

/**
 * Real cancellation test panel using actual RdLn components
 * This tests the real Myers algorithm with actual cancellation behavior
 */
export const CancellationTestPanel: React.FC = () => {
  const [testRunning, setTestRunning] = useState(false);
  
  const {
    compareDocuments,
    cancelComparison,
    isProcessing,
    isCancelling,
    result,
    error,
    setOriginalText,
    setRevisedText
  } = useComparison();

  // HUGE test data that will definitely take time to process (50k+ characters each)
  const generateMassiveText = (variant: 'original' | 'revised') => {
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

      `ARTICLE III: PAYMENT TERMS
3.01 Fees. In consideration for the Services, Company shall pay Service Provider the fees set forth in the applicable Statement of Work. Unless otherwise specified, all fees are due within thirty (30) days after Company's receipt of an undisputed invoice from Service Provider.
3.02 Expenses. Company shall reimburse Service Provider for all reasonable, documented, out-of-pocket expenses incurred in connection with the performance of Services, provided that such expenses have been pre-approved in writing by Company.
3.03 Taxes. Each Party shall be responsible for its own taxes arising from or relating to this Agreement and the performance of Services hereunder.
3.04 Late Payment. Any undisputed amounts not paid when due shall bear interest at the rate of one and one-half percent (1.5%) per month or the maximum rate permitted by applicable law, whichever is less.`,

      `ARTICLE IV: INTELLECTUAL PROPERTY
4.01 Ownership of Work Product. All work product, deliverables, and other materials created by Service Provider in the course of performing Services (collectively, "Work Product") shall be owned by Company. Service Provider hereby assigns to Company all right, title and interest in and to the Work Product.
4.02 Pre-Existing IP. Each Party shall retain ownership of its pre-existing intellectual property. Service Provider grants Company a non-exclusive, royalty-free license to use Service Provider's pre-existing intellectual property solely to the extent necessary to use the Work Product.
4.03 Third Party IP. Service Provider represents and warrants that the Work Product will not infringe any third party intellectual property rights.
4.04 Moral Rights. To the extent permitted by applicable law, Service Provider waives any moral rights it may have in the Work Product.`,

      `ARTICLE V: CONFIDENTIALITY
5.01 Confidentiality Obligations. Each Party acknowledges that it may have access to certain confidential information of the other Party. Each Party agrees to maintain in confidence all Confidential Information received from the other Party and to use such Confidential Information solely for the purpose of performing its obligations under this Agreement.
5.02 Exceptions. The obligations set forth in Section 5.01 shall not apply to information that: (a) is or becomes generally available to the public other than as a result of a breach of this Agreement; (b) was known to the receiving Party prior to disclosure; (c) is independently developed by the receiving Party without use of or reference to the Confidential Information; or (d) is required to be disclosed by law or court order.
5.03 Return of Information. Upon termination of this Agreement, each Party shall promptly return or destroy all Confidential Information received from the other Party.`,

      `ARTICLE VI: REPRESENTATIONS AND WARRANTIES
6.01 Mutual Representations. Each Party represents and warrants that: (a) it has full corporate power and authority to enter into this Agreement; (b) the execution of this Agreement has been duly authorized; (c) this Agreement has been duly executed and delivered and constitutes a legal, valid and binding obligation; and (d) the execution and performance of this Agreement will not violate any other agreement to which it is a party.
6.02 Service Provider Warranties. Service Provider represents and warrants that: (a) it has the necessary skills, experience and resources to perform the Services; (b) the Services will be performed in a professional manner; (c) the Work Product will be free from material defects; and (d) the Work Product will not infringe any third party rights.
6.03 Disclaimer. EXCEPT AS EXPRESSLY SET FORTH HEREIN, EACH PARTY DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.`
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

  const hugeOriginalText = generateMassiveText('original');
  const hugeRevisedText = generateMassiveText('revised');

  const handleStartTest = async () => {
    console.log('🧪 REAL TEST: Starting cancellation test with actual useComparison hook');
    console.log(`📝 REAL TEST: HUGE Text lengths - Original: ${hugeOriginalText.length}, Revised: ${hugeRevisedText.length}`);
    console.log('🚀 REAL TEST: This will process 75+ sections with thousands of differences - should run for 5-10 seconds');
    
    setTestRunning(true);
    
    // Set the huge test texts
    setOriginalText(hugeOriginalText);
    setRevisedText(hugeRevisedText);
    
    // Start the real comparison with huge inputs
    try {
      await compareDocuments(false, false, hugeOriginalText, hugeRevisedText);
      console.log('🧪 REAL TEST: Comparison completed successfully');
    } catch (error) {
      console.log('🧪 REAL TEST: Comparison ended with error:', error);
    } finally {
      setTestRunning(false);
    }
  };

  const handleCancel = () => {
    console.log('🧪 REAL TEST: User clicked cancel - calling real cancelComparison()');
    cancelComparison();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🧪 Real Cancellation Test Panel
      </h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📋 Test Instructions:</h4>
          <ol className="text-sm text-blue-700 space-y-1 ml-4">
            <li>1. <strong>Open DevTools Console</strong> to see detailed logs</li>
            <li>2. <strong>Click "Start Real Test"</strong> to begin processing with actual Myers algorithm</li>
            <li>3. <strong>Click "Cancel Test"</strong> within ~2-3 seconds</li>
            <li>4. <strong>Watch Console</strong> for cancellation logs (should stop within ~100ms)</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStartTest}
            disabled={isProcessing || testRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isProcessing || testRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isProcessing || testRunning ? '🔄 Processing...' : '🚀 Start Real Test'}
          </button>

          <button
            onClick={handleCancel}
            disabled={!isProcessing && !testRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              !isProcessing && !testRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isCancelling ? '🚫 Cancelling...' : '❌ Cancel Test'}
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">📊 Real Status:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Processing:</strong> 
              <span className={`ml-2 px-2 py-1 rounded ${
                isProcessing ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {isProcessing ? '🔄 Active' : '⏸️ Idle'}
              </span>
            </div>
            <div>
              <strong>Cancelling:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${
                isCancelling ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {isCancelling ? '🚫 Yes' : '✅ No'}
              </span>
            </div>
            <div>
              <strong>Last Result:</strong>
              <span className="ml-2 text-gray-600">
                {result ? `✅ ${result.changes.length} changes found` : 
                 error ? `❌ ${error}` : '⏳ None'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ What to Look For:</h4>
          <ul className="text-sm text-yellow-700 space-y-1 ml-4">
            <li>• <strong>Before Fix:</strong> Processing continued for seconds after cancel</li>
            <li>• <strong>After Fix:</strong> Processing stops within ~100ms of cancel click</li>
            <li>• <strong>Console Logs:</strong> Shows exactly where cancellation occurs in algorithm</li>
            <li>• <strong>Status Updates:</strong> "Cancelling" state should appear immediately</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">
            <strong>💡 This uses the REAL useComparison hook and Myers algorithm</strong> - 
            not a simulation. The test processes ~{Math.round(hugeOriginalText.length / 1000)}k characters 
            with the actual RdLn comparison engine. This HUGE input should run for 5-10+ seconds.
          </p>
        </div>
      </div>
    </div>
  );
};