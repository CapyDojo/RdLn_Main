/**
 * Manual Cross-Component Synchronization Test Script
 * 
 * Run this in the browser console to test RdLn Memory synchronization
 * across ComparisonInterface, RdLnMemorySidePanel, and RdLnMemoryDropdown
 * 
 * Requirements tested: 1.1, 1.2, 1.3, 1.4
 */

console.log('🧪 Starting Cross-Component Synchronization Tests...');

// Test configuration
const TEST_CONFIG = {
  DELAY_BETWEEN_TESTS: 2000, // 2 seconds
  VERIFICATION_DELAY: 500,   // 0.5 seconds
  AUTO_CLEANUP: true
};

// Test data
const TEST_SESSIONS = {
  session1: {
    originalText: 'Test original content for sync verification',
    revisedText: 'Test revised content for sync verification',
    sessionName: 'Sync Test Session 1'
  },
  session2: {
    originalText: 'Second test session original content',
    revisedText: 'Second test session revised content', 
    sessionName: 'Sync Test Session 2'
  }
};

// Utility functions
const utils = {
  // Wait for specified milliseconds
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Find element with retry logic
  findElement: async (selector, maxRetries = 10) => {
    for (let i = 0; i < maxRetries; i++) {
      const element = document.querySelector(selector);
      if (element) return element;
      await utils.wait(100);
    }
    throw new Error(`Element not found: ${selector}`);
  },
  
  // Check if element exists
  elementExists: (selector) => !!document.querySelector(selector),
  
  // Get session count from UI
  getSessionCount: () => {
    const countElements = document.querySelectorAll('[data-testid*="session-count"], .session-count');
    for (const element of countElements) {
      const match = element.textContent.match(/(\d+)\s+session/);
      if (match) return parseInt(match[1]);
    }
    return 0;
  },
  
  // Clear all existing sessions
  clearAllSessions: async () => {
    console.log('🧹 Clearing existing sessions...');
    
    // Try to find and click clear all button
    const clearButtons = document.querySelectorAll('button');
    for (const button of clearButtons) {
      if (button.textContent.includes('Clear All')) {
        button.click();
        await utils.wait(100);
        
        // Confirm if dialog appears
        const confirmButtons = document.querySelectorAll('button');
        for (const confirmBtn of confirmButtons) {
          if (confirmBtn.textContent.includes('OK') || confirmBtn.textContent.includes('Yes')) {
            confirmBtn.click();
            break;
          }
        }
        break;
      }
    }
    
    // Alternative: Clear localStorage directly
    const existingSessions = localStorage.getItem('rdln-memory-sessions');
    if (existingSessions) {
      localStorage.setItem('rdln-memory-sessions', JSON.stringify([]));
      console.log('✅ Cleared sessions from localStorage');
    }
  }
};

// Test functions
const tests = {
  // Test 1: Save session in side panel, verify appears in dropdown
  async testSidePanelToDropdown() {
    console.log('\n📋 Test 1: Save in Side Panel → Appears in Dropdown');
    
    try {
      // Step 1: Open side panel
      console.log('  1. Opening side panel...');
      const memoryTab = await utils.findElement('[data-memory-tab], .memory-tab, button[title*="Memory"]');
      memoryTab.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      // Step 2: Add test content to inputs
      console.log('  2. Adding test content...');
      const originalTextarea = document.querySelector('textarea[placeholder*="original"], textarea[aria-label*="original"]');
      const revisedTextarea = document.querySelector('textarea[placeholder*="revised"], textarea[aria-label*="revised"]');
      
      if (originalTextarea && revisedTextarea) {
        originalTextarea.value = TEST_SESSIONS.session1.originalText;
        revisedTextarea.value = TEST_SESSIONS.session1.revisedText;
        
        // Trigger change events
        originalTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        revisedTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Step 3: Save session in side panel
      console.log('  3. Saving session in side panel...');
      const saveButton = await utils.findElement('button:has-text("Save Current"), button[title*="Save"]');
      saveButton.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      // Step 4: Open dropdown and verify session appears
      console.log('  4. Opening dropdown to verify session...');
      const dropdownTrigger = await utils.findElement('[data-testid="memory-dropdown-trigger"], .memory-dropdown-trigger');
      dropdownTrigger.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      // Step 5: Verify session exists in dropdown
      const sessionInDropdown = utils.elementExists(`[data-session-name*="${TEST_SESSIONS.session1.sessionName}"]`);
      
      if (sessionInDropdown) {
        console.log('  ✅ SUCCESS: Session appears in dropdown immediately');
        return true;
      } else {
        console.log('  ❌ FAILED: Session not found in dropdown');
        return false;
      }
      
    } catch (error) {
      console.log('  ❌ ERROR:', error.message);
      return false;
    }
  },
  
  // Test 2: Delete session in dropdown, verify disappears from side panel
  async testDropdownToSidePanel() {
    console.log('\n📋 Test 2: Delete in Dropdown → Disappears from Side Panel');
    
    try {
      // Step 1: Ensure we have a session to delete
      console.log('  1. Verifying session exists...');
      const sessionCount = utils.getSessionCount();
      if (sessionCount === 0) {
        console.log('  ⚠️  No sessions found, creating one first...');
        await tests.testSidePanelToDropdown();
      }
      
      // Step 2: Open dropdown
      console.log('  2. Opening dropdown...');
      const dropdownTrigger = await utils.findElement('[data-testid="memory-dropdown-trigger"], .memory-dropdown-trigger');
      dropdownTrigger.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      // Step 3: Find and click delete button
      console.log('  3. Deleting session from dropdown...');
      const deleteButton = await utils.findElement('button[title*="Delete"], button:has-text("Delete")');
      deleteButton.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      // Step 4: Open side panel and verify session is gone
      console.log('  4. Opening side panel to verify deletion...');
      const memoryTab = await utils.findElement('[data-memory-tab], .memory-tab');
      memoryTab.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      // Step 5: Verify session is gone from side panel
      const sessionInSidePanel = utils.elementExists(`[data-session-name*="${TEST_SESSIONS.session1.sessionName}"]`);
      
      if (!sessionInSidePanel) {
        console.log('  ✅ SUCCESS: Session disappeared from side panel immediately');
        return true;
      } else {
        console.log('  ❌ FAILED: Session still exists in side panel');
        return false;
      }
      
    } catch (error) {
      console.log('  ❌ ERROR:', error.message);
      return false;
    }
  },
  
  // Test 3: Save session in ComparisonInterface, verify appears in both components
  async testComparisonInterfaceToAll() {
    console.log('\n📋 Test 3: Save in ComparisonInterface → Appears in Both Components');
    
    try {
      // Step 1: Add content and trigger comparison
      console.log('  1. Adding content and running comparison...');
      const originalTextarea = document.querySelector('textarea[placeholder*="original"]');
      const revisedTextarea = document.querySelector('textarea[placeholder*="revised"]');
      
      if (originalTextarea && revisedTextarea) {
        originalTextarea.value = TEST_SESSIONS.session2.originalText;
        revisedTextarea.value = TEST_SESSIONS.session2.revisedText;
        
        // Trigger change events
        originalTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        revisedTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Step 2: Run comparison (this should auto-save)
      console.log('  2. Running comparison...');
      const compareButton = await utils.findElement('button:has-text("Compare"), button[title*="Compare"]');
      compareButton.click();
      await utils.wait(2000); // Wait for comparison to complete
      
      // Step 3: Verify session appears in dropdown
      console.log('  3. Checking dropdown for auto-saved session...');
      const dropdownTrigger = await utils.findElement('[data-testid="memory-dropdown-trigger"]');
      dropdownTrigger.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      const sessionInDropdown = utils.elementExists(`[data-session-name*="${TEST_SESSIONS.session2.sessionName}"]`);
      
      // Step 4: Verify session appears in side panel
      console.log('  4. Checking side panel for auto-saved session...');
      const memoryTab = await utils.findElement('[data-memory-tab]');
      memoryTab.click();
      await utils.wait(TEST_CONFIG.VERIFICATION_DELAY);
      
      const sessionInSidePanel = utils.elementExists(`[data-session-name*="${TEST_SESSIONS.session2.sessionName}"]`);
      
      if (sessionInDropdown && sessionInSidePanel) {
        console.log('  ✅ SUCCESS: Session appears in both dropdown and side panel');
        return true;
      } else {
        console.log('  ❌ FAILED: Session missing from components', {
          dropdown: sessionInDropdown,
          sidePanel: sessionInSidePanel
        });
        return false;
      }
      
    } catch (error) {
      console.log('  ❌ ERROR:', error.message);
      return false;
    }
  },
  
  // Test 4: Verify no page reload required
  async testNoPageReload() {
    console.log('\n📋 Test 4: No Page Reload Required for Synchronization');
    
    try {
      // Step 1: Monitor for page reload attempts
      console.log('  1. Setting up page reload monitoring...');
      let reloadAttempted = false;
      const originalReload = window.location.reload;
      window.location.reload = () => {
        reloadAttempted = true;
        console.log('  ⚠️  Page reload attempted!');
      };
      
      // Step 2: Perform multiple operations that should sync
      console.log('  2. Performing sync operations...');
      
      // Save a session
      await tests.testSidePanelToDropdown();
      await utils.wait(500);
      
      // Delete a session
      await tests.testDropdownToSidePanel();
      await utils.wait(500);
      
      // Step 3: Restore original reload function
      window.location.reload = originalReload;
      
      // Step 4: Verify no reload was attempted
      if (!reloadAttempted) {
        console.log('  ✅ SUCCESS: No page reload required for synchronization');
        return true;
      } else {
        console.log('  ❌ FAILED: Page reload was attempted during synchronization');
        return false;
      }
      
    } catch (error) {
      console.log('  ❌ ERROR:', error.message);
      return false;
    }
  }
};

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Cross-Component Synchronization Test Suite');
  console.log('=' .repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // Clear existing sessions before starting
  if (TEST_CONFIG.AUTO_CLEANUP) {
    await utils.clearAllSessions();
    await utils.wait(1000);
  }
  
  // Run all tests
  const testFunctions = [
    tests.testSidePanelToDropdown,
    tests.testDropdownToSidePanel,
    tests.testComparisonInterfaceToAll,
    tests.testNoPageReload
  ];
  
  for (const testFn of testFunctions) {
    results.total++;
    
    try {
      const success = await testFn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      results.failed++;
    }
    
    // Wait between tests
    await utils.wait(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }
  
  // Print results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`  ✅ Passed: ${results.passed}/${results.total}`);
  console.log(`  ❌ Failed: ${results.failed}/${results.total}`);
  console.log(`  📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All cross-component synchronization tests passed!');
    console.log('✅ Requirements 1.1, 1.2, 1.3, 1.4 verified');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  return results;
}

// Export for manual execution
window.testCrossComponentSync = {
  runAllTests,
  tests,
  utils,
  TEST_CONFIG
};

console.log('✅ Cross-component sync test script loaded!');
console.log('Run: testCrossComponentSync.runAllTests() to start testing');
console.log('Or run individual tests: testCrossComponentSync.tests.testSidePanelToDropdown()');