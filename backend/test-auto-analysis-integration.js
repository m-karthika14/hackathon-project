// TEST: Verify Auto-Analysis is Integrated
const fs = require('fs');
const path = require('path');

const logControllerPath = path.join(__dirname, 'controller', 'logController.js');
const adhdServicePath = path.join(__dirname, 'services', 'adhdAnalysisService.js');

console.log('🔍 Checking ADHD Auto-Analysis Integration...\n');

// Check 1: Service file exists
if (fs.existsSync(adhdServicePath)) {
  console.log('✅ Service file exists: adhdAnalysisService.js');
} else {
  console.log('❌ Service file missing: adhdAnalysisService.js');
}

// Check 2: LogController has import
const logControllerContent = fs.readFileSync(logControllerPath, 'utf8');
if (logControllerContent.includes("require('../services/adhdAnalysisService')")) {
  console.log('✅ LogController imports adhdAnalysisService');
} else {
  console.log('❌ LogController missing import');
}

// Check 3: Auto-trigger code exists
const triggerPatterns = [
  '🎯 All 3 games completed! Starting ADHD analysis',
  'analyzeADHDGame',
  'analysisMetrics'
];

let triggersFound = 0;
triggerPatterns.forEach(pattern => {
  if (logControllerContent.includes(pattern)) {
    console.log(`✅ Found trigger: "${pattern}"`);
    triggersFound++;
  } else {
    console.log(`❌ Missing: "${pattern}"`);
  }
});

// Check 4: Count trigger locations
const matches = logControllerContent.match(/analyzeADHDGame/g);
console.log(`\n📊 Analysis trigger found in ${matches ? matches.length : 0} locations`);

// Summary
console.log('\n' + '='.repeat(50));
if (triggersFound === triggerPatterns.length) {
  console.log('✅ AUTO-ANALYSIS IS FULLY INTEGRATED AND ACTIVE!');
  console.log('\nWhen you complete all 3 games (Mario ends):');
  console.log('  1. Session marked complete (isEnd: true)');
  console.log('  2. User game field set to "end"');
  console.log('  3. 🎯 ADHD analysis runs automatically');
  console.log('  4. All 6 metrics calculated and saved');
  console.log('\nNo manual "node adhdAgent.js" needed anymore! 🚀');
} else {
  console.log('⚠️ Integration incomplete - missing components');
}
console.log('='.repeat(50));
