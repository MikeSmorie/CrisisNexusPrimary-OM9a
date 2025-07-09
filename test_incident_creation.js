// Test script for incident creation debugging
const { createIncident } = require('./server/lib/escalationEngine');

async function testIncidentCreation() {
  try {
    console.log('Testing AI-powered incident creation...');
    
    const result = await createIncident({
      incidentType: 'fire',
      description: 'Kitchen fire in apartment building',
      location: '123 Test Street',
      reportedBy: 'TestUser',
      userId: 1 // Use system user ID to avoid lookup issues
    });
    
    console.log('SUCCESS: Incident created with AI assessment');
    console.log('Threat Level:', result.aiAssessment.threat_level);
    console.log('Escalation Required:', result.aiAssessment.escalation_required);
    console.log('Incident ID:', result.incident.id);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testIncidentCreation().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});