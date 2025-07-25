// Test script for enhanced smart voice vetting system
import { classifyIntent, generateAcknowledgement } from './lib/classifyIntent.js';

const testCases = [
  { input: "There is a fire in my building", expectedType: "emergency", shouldRoute: true },
  { input: "Hello, can you hear me?", expectedType: "greeting", shouldRoute: false },
  { input: "Uhhhhh, hmmmmm", expectedType: "noise", shouldRoute: false },
  { input: "The weather is nice today", expectedType: "unknown", shouldRoute: false },
  { input: "Someone is drowning at the beach", expectedType: "emergency", shouldRoute: true },
  { input: "Testing testing 123", expectedType: "greeting", shouldRoute: false },
  { input: "Help! There's been an accident!", expectedType: "emergency", shouldRoute: true },
  { input: "I fell down the stairs and I'm injured", expectedType: "emergency", shouldRoute: true },
  { input: "What's happening?", expectedType: "noise", shouldRoute: false }
];

console.log("🔍 Smart Voice Vetting Test Results:");
console.log("====================================");
console.log("Dual-Threshold: Emergency Type + 90%+ Confidence Required\n");

testCases.forEach((test, index) => {
  const result = classifyIntent(test.input);
  const routeToResponder = result.type === 'emergency' && result.confidence >= 0.9;
  const acknowledgement = generateAcknowledgement(result.type, result.confidence);
  
  console.log(`Test ${index + 1}:`);
  console.log(`Input: "${test.input}"`);
  console.log(`Intent: 🧠 ${result.type.toUpperCase()} (${Math.round(result.confidence * 100)}%)`);
  console.log(`Expected: ${test.expectedType} | Should Route: ${test.shouldRoute}`);
  console.log(`Decision: ${routeToResponder ? '📡 Routed to Responder' : '⛔ Held for Clarification'}`);
  console.log(`Acknowledgement: "${acknowledgement}"`);
  console.log(`Result: ${routeToResponder === test.shouldRoute ? '✅ CORRECT' : '❌ FAILED'}\n`);
});

console.log("🛡️ Summary: Only high-confidence emergencies (≥90%) reach responders.");
console.log("📞 All other content receives appropriate caller acknowledgement.");