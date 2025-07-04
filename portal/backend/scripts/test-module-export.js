// Test module exports
console.log('Testing module exports...\n');

try {
  const module1 = require('./generate-honeypot-prompts');
  console.log('Module loaded successfully');
  console.log('Available exports:', Object.keys(module1));
  
  if (module1.extractTrackingCode) {
    console.log('\nTesting extractTrackingCode function:');
    const testString = 'Test ​tracking-123-abc​ content';
    const result = module1.extractTrackingCode(testString);
    console.log('Result:', result);
  }
} catch (error) {
  console.error('Error loading module:', error.message);
}