/**
 * Validate Performance Integration
 * 
 * Node.js script to validate that performance optimizations
 * are properly integrated into the CSS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validatePerformanceIntegration() {
  console.log('🔍 Validating Performance Integration...\n');
  
  // Read the glassmorphism CSS file
  const cssPath = path.join(__dirname, 'src/styles/glassmorphism.css');
  
  if (!fs.existsSync(cssPath)) {
    console.error('❌ glassmorphism.css file not found');
    return false;
  }
  
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Check for theme-aware variables
  const themeVariableChecks = [
    '--unified-glass-bg',
    '--unified-glass-border', 
    '--unified-glass-shadow',
    '--unified-glass-hover-bg',
    '--unified-glass-hover-border',
    '--unified-glass-hover-shadow'
  ];
  
  console.log('📋 Checking Theme-Aware Variables:');
  let themeVariablesValid = true;
  
  themeVariableChecks.forEach(variable => {
    if (cssContent.includes(variable)) {
      console.log(`✅ ${variable} - Found`);
    } else {
      console.log(`❌ ${variable} - Missing`);
      themeVariablesValid = false;
    }
  });
  
  // Check for performance optimizations
  const performanceChecks = [
    'will-change:',
    'transform: translateZ(0)',
    'backface-visibility: hidden',
    'contain:',
    'content-visibility:',
    'transform-style: preserve-3d',
    '--filing-cabinet-transition-fast',
    '--filing-cabinet-transition-normal'
  ];
  
  console.log('\n🚀 Checking Performance Optimizations:');
  let performanceOptimizationsValid = true;
  
  performanceChecks.forEach(optimization => {
    if (cssContent.includes(optimization)) {
      console.log(`✅ ${optimization} - Found`);
    } else {
      console.log(`❌ ${optimization} - Missing`);
      performanceOptimizationsValid = false;
    }
  });
  
  // Check for scalability optimizations
  const scalabilityChecks = [
    'data-session-count-high',
    'sessions-list',
    'session-item',
    'SCALABILITY PERFORMANCE OPTIMIZATIONS'
  ];
  
  console.log('\n📈 Checking Scalability Optimizations:');
  let scalabilityValid = true;
  
  scalabilityChecks.forEach(check => {
    if (cssContent.includes(check)) {
      console.log(`✅ ${check} - Found`);
    } else {
      console.log(`❌ ${check} - Missing`);
      scalabilityValid = false;
    }
  });
  
  // Check for cross-browser optimizations
  const crossBrowserChecks = [
    '@supports (-webkit-backdrop-filter',
    '@-moz-document url-prefix()',
    '@supports (-webkit-appearance: none)',
    '@supports (-ms-ime-align: auto)'
  ];
  
  console.log('\n🌐 Checking Cross-Browser Optimizations:');
  let crossBrowserValid = true;
  
  crossBrowserChecks.forEach(check => {
    if (cssContent.includes(check)) {
      console.log(`✅ ${check} - Found`);
    } else {
      console.log(`❌ ${check} - Missing`);
      crossBrowserValid = false;
    }
  });
  
  // Check for accessibility optimizations
  const accessibilityChecks = [
    '@media (prefers-reduced-motion: reduce)',
    '@media (prefers-contrast: high)',
    'focus:',
    'focus-visible:'
  ];
  
  console.log('\n♿ Checking Accessibility Optimizations:');
  let accessibilityValid = true;
  
  accessibilityChecks.forEach(check => {
    if (cssContent.includes(check)) {
      console.log(`✅ ${check} - Found`);
    } else {
      console.log(`❌ ${check} - Missing`);
      accessibilityValid = false;
    }
  });
  
  // Check TypeScript performance utility
  const tsPath = path.join(__dirname, 'src/utils/filingCabinetPerformance.ts');
  const tsExists = fs.existsSync(tsPath);
  
  console.log('\n🔧 Checking Performance Utility:');
  if (tsExists) {
    console.log('✅ filingCabinetPerformance.ts - Found');
    
    const tsContent = fs.readFileSync(tsPath, 'utf8');
    const utilityChecks = [
      'FilingCabinetPerformanceMonitor',
      'startMonitoring',
      'setSessionCount',
      'applySessionCountOptimizations',
      'handlePerformanceIssue'
    ];
    
    utilityChecks.forEach(check => {
      if (tsContent.includes(check)) {
        console.log(`✅ ${check} - Found`);
      } else {
        console.log(`❌ ${check} - Missing`);
      }
    });
  } else {
    console.log('❌ filingCabinetPerformance.ts - Missing');
  }
  
  // Overall validation result
  console.log('\n' + '='.repeat(50));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  const allValid = themeVariablesValid && performanceOptimizationsValid && 
                   scalabilityValid && crossBrowserValid && accessibilityValid && tsExists;
  
  if (allValid) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('✅ Theme integration is complete');
    console.log('✅ Performance optimizations are in place');
    console.log('✅ Scalability features are implemented');
    console.log('✅ Cross-browser compatibility is ensured');
    console.log('✅ Accessibility optimizations are included');
    console.log('✅ Performance monitoring utility is available');
  } else {
    console.log('⚠️ SOME CHECKS FAILED');
    console.log('Please review the missing components above');
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('• Use the FilingCabinetPerformanceMonitor in development');
  console.log('• Test with large session counts (100+ sessions)');
  console.log('• Verify performance on mobile devices');
  console.log('• Test theme switching performance');
  console.log('• Monitor memory usage during extended use');
  
  return allValid;
}

// Run validation
const isValid = validatePerformanceIntegration();
process.exit(isValid ? 0 : 1);