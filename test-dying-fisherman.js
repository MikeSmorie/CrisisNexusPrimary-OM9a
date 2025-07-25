// Test for the "dying fisherman" critical bug fix
import { classifyIntent } from './lib/classifyIntent.js';
import { handleIntent } from './lib/intentRouter.js';

const criticalTestCases = [
  "There is a fisherman in the sea who is dying",
  "daar's 'n hengelaar in die see wat dood gaan", // Afrikaans original
  "Someone is drowning at the beach",
  "A person fell and is bleeding badly",
  "There's been a car accident",
  "Help! Fire in the building!",
  "How are you today?", // Should NOT be emergency
  "Hello, can you hear me?" // Should NOT be emergency
];

console.log("🚨 CRITICAL BUG TEST: Dying Fisherman Scenario");
console.log("================================================");

criticalTestCases.forEach((testInput, index) => {
  const result = classifyIntent(testInput);
  const intentResponse = handleIntent(result.type.toUpperCase(), result.confidence, testInput);
  const dispatch = intentResponse.routeToResponder || false;
  
  console.log(`\nTest ${index + 1}: "${testInput}"`);
  console.log(`Classification: ${result.type.toUpperCase()} (${Math.round(result.confidence * 100)}%)`);
  console.log(`Decision: ${dispatch ? '✅ EMERGENCY DISPATCH' : '❌ BLOCKED/HELD'}`);
  
  // Special check for dying fisherman
  if (testInput.includes('dying') || testInput.includes('dood gaan')) {
    console.log(`⚠️  CRITICAL: ${dispatch ? 'PASSED - Emergency dispatched' : 'FAILED - Life at risk!'}`);
  }
});

console.log("\n🎯 Expected: All life-threatening scenarios should dispatch immediately.");
console.log("❌ Current Issue: 'Dying fisherman' incorrectly classified as UNKNOWN (40%)");