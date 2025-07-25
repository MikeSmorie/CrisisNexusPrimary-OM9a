// Test script for intent classification system
const { classifyIntent, generateAcknowledgement } = require('./lib/classifyIntent.ts');

const testCases = [
  { input: "There is a fire in my building", expected: "emergency" },
  { input: "Hello, can you hear me?", expected: "greeting" },
  { input: "Uhhhhh, hmmmmm", expected: "noise" },
  { input: "The weather is nice today", expected: "unknown" },
  { input: "Someone is drowning at the beach", expected: "emergency" },
  { input: "Testing testing 123", expected: "greeting" },
  { input: "Help! There's been an accident!", expected: "emergency" }
];

console.log("🔍 Intent Classification Test Results:");
console.log("=====================================");

testCases.forEach((test, index) => {
  const intent = classifyIntent(test.input);
  const acknowledgement = generateAcknowledgement(intent);
  const routeToResponder = intent === 'emergency';
  
  console.log(`\nTest ${index + 1}:`);
  console.log(`Input: "${test.input}"`);
  console.log(`Intent: ${intent} (Expected: ${test.expected})`);
  console.log(`Route to Responder: ${routeToResponder ? '✅ YES' : '❌ NO'}`);
  console.log(`Acknowledgement: "${acknowledgement}"`);
  console.log(`Status: ${intent === test.expected ? '✅ PASS' : '❌ FAIL'}`);
});