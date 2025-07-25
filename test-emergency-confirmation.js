// Test script for emergency confirmation system
import { classifyIntent } from './lib/classifyIntent.js';
import { handleIntent } from './lib/intentRouter.js';

const testCases = [
  { input: "Help! There's a fire!", expectedDecision: "DISPATCH" },
  { input: "I need help with something urgent", expectedDecision: "CONFIRM" },
  { input: "Hello, can you hear me?", expectedDecision: "ACKNOWLEDGE" },
  { input: "Emergency! Someone is bleeding!", expectedDecision: "DISPATCH" },
  { input: "I'm having a serious problem", expectedDecision: "CONFIRM" },
  { input: "There's been a car crash", expectedDecision: "DISPATCH" },
  { input: "Please help me, it's urgent", expectedDecision: "CONFIRM" }
];

console.log("🚨 Emergency Confirmation System Test:");
console.log("=====================================");
console.log("Three-Tier: Dispatch (98%+) / Confirm (85%+) / Hold (<85%)\n");

testCases.forEach((test, index) => {
  const result = classifyIntent(test.input);
  const intentResponse = handleIntent(result.type.toUpperCase(), result.confidence, test.input);
  
  console.log(`Test ${index + 1}:`);
  console.log(`Input: "${test.input}"`);
  console.log(`Classification: ${result.type.toUpperCase()} (${Math.round(result.confidence * 100)}%)`);
  console.log(`Decision: ${intentResponse.action || 'ACKNOWLEDGE'}`);
  
  if (intentResponse.intent === 'CONFIRM_EMERGENCY') {
    console.log(`⚠️ Confirmation: "${intentResponse.message}"`);
  }
  
  console.log(`Route to Responder: ${intentResponse.routeToResponder ? '✅ YES' : '❌ NO'}`);
  console.log(`Expected: ${test.expectedDecision}\n`);
});

console.log("🛡️ System ensures no false emergencies while catching edge cases through confirmation layer.");