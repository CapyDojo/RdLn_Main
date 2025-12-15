// DOCX Prototype Validation Script
// Run this in browser console to verify functionality

console.log('🔍 DOCX Prototype Validation Starting...');

// Check if required elements exist
const requiredElements = [
    'dropZone',
    'fileInput', 
    'strategySelect',
    'statusPanel',
    'outputPanel',
    'copyBtn',
    'progressFill'
];

let validationResults = [];

// 1. Check DOM Elements
console.log('\n1️⃣ Checking DOM Elements...');
requiredElements.forEach(id => {
    const element = document.getElementById(id);
    const exists = element !== null;
    validationResults.push({
        test: `Element #${id}`,
        passed: exists,
        message: exists ? '✅ Found' : '❌ Missing'
    });
    console.log(`   ${exists ? '✅' : '❌'} #${id}`);
});

// 2. Check JavaScript Class
console.log('\n2️⃣ Checking JavaScript Implementation...');
const hasExtractorClass = typeof DocxTextExtractor !== 'undefined';
validationResults.push({
    test: 'DocxTextExtractor Class',
    passed: hasExtractorClass,
    message: hasExtractorClass ? '✅ Class defined' : '❌ Class missing'
});
console.log(`   ${hasExtractorClass ? '✅' : '❌'} DocxTextExtractor class`);

// 3. Check JSZip Library
console.log('\n3️⃣ Checking Dependencies...');
const hasJSZip = typeof JSZip !== 'undefined';
validationResults.push({
    test: 'JSZip Library',
    passed: hasJSZip,
    message: hasJSZip ? '✅ JSZip loaded' : '❌ JSZip missing'
});
console.log(`   ${hasJSZip ? '✅' : '❌'} JSZip library`);

// 4. Check Event Listeners
console.log('\n4️⃣ Checking Event Listeners...');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const copyBtn = document.getElementById('copyBtn');

const hasDropEvents = dropZone && dropZone.ondragover !== null;
const hasFileEvents = fileInput && fileInput.onchange !== null;
const hasCopyEvents = copyBtn && copyBtn.onclick !== null;

validationResults.push(
    {
        test: 'Drop Zone Events',
        passed: hasDropEvents,
        message: hasDropEvents ? '✅ Events attached' : '❌ Events missing'
    },
    {
        test: 'File Input Events',
        passed: hasFileEvents,
        message: hasFileEvents ? '✅ Events attached' : '❌ Events missing'
    },
    {
        test: 'Copy Button Events', 
        passed: hasCopyEvents,
        message: hasCopyEvents ? '✅ Events attached' : '❌ Events missing'
    }
);

console.log(`   ${hasDropEvents ? '✅' : '❌'} Drop zone events`);
console.log(`   ${hasFileEvents ? '✅' : '❌'} File input events`);
console.log(`   ${hasCopyEvents ? '✅' : '❌'} Copy button events`);

// 5. Check Strategy Selection
console.log('\n5️⃣ Checking Strategy Options...');
const strategySelect = document.getElementById('strategySelect');
const hasStrategies = strategySelect && strategySelect.options.length >= 3;
validationResults.push({
    test: 'Strategy Options',
    passed: hasStrategies,
    message: hasStrategies ? `✅ ${strategySelect.options.length} strategies available` : '❌ Missing strategies'
});
console.log(`   ${hasStrategies ? '✅' : '❌'} Strategy selection (${strategySelect ? strategySelect.options.length : 0} options)`);

// 6. Test Method Availability
console.log('\n6️⃣ Checking Core Methods...');
if (hasExtractorClass) {
    try {
        const extractor = new DocxTextExtractor();
        const methods = [
            'processFile',
            'validateFile',
            'extractWithXmlComprehensive',
            'parseNumberingDefinitions',
            'processDocumentWithLists',
            'copyToClipboard'
        ];
        
        methods.forEach(method => {
            const hasMethod = typeof extractor[method] === 'function';
            validationResults.push({
                test: `Method: ${method}`,
                passed: hasMethod,
                message: hasMethod ? '✅ Available' : '❌ Missing'
            });
            console.log(`   ${hasMethod ? '✅' : '❌'} ${method}()`);
        });
    } catch (error) {
        console.log(`   ❌ Could not instantiate DocxTextExtractor: ${error.message}`);
    }
}

// 7. Generate Summary Report
console.log('\n📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

const totalTests = validationResults.length;
const passedTests = validationResults.filter(r => r.passed).length;
const failedTests = totalTests - passedTests;

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);

if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    validationResults.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
    });
}

// 8. Provide Test Instructions
console.log('\n🧪 MANUAL TESTING INSTRUCTIONS:');
console.log('1. Create a simple DOCX file with numbered lists');
console.log('2. Drag the file onto the drop zone');
console.log('3. Verify text extraction preserves list formatting');
console.log('4. Click "Copy to Clipboard" and paste into notepad');
console.log('5. Compare with Word → Select All → Copy → Paste result');

console.log('\n✨ Validation Complete!');

// Return results for programmatic access
window.validationResults = validationResults;
return {
    totalTests,
    passedTests,
    failedTests,
    successRate: Math.round((passedTests/totalTests) * 100),
    results: validationResults
};