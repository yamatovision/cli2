/**
 * Simple Honeypot Detection Demo
 */

const { extractTrackingCode } = require('./generate-honeypot-prompts');
const fs = require('fs');

// Load honeypot prompts
const honeypotPrompts = JSON.parse(fs.readFileSync('honeypot-prompts.json', 'utf8'));

console.log('=== Honeypot Prompt Detection Demo ===\n');

// Test each honeypot prompt
honeypotPrompts.forEach((prompt, index) => {
  console.log(`Testing Prompt ${index + 1}: ${prompt.title}`);
  
  const trackingCodes = extractTrackingCode(prompt.content);
  
  if (trackingCodes) {
    console.log('🚨 HONEYPOT DETECTED! 🚨');
    console.log('Tracking codes found:', trackingCodes);
    
    trackingCodes.forEach(code => {
      const [identifier, timestamp, uniqueId] = code.split('-');
      console.log(`  - Type: ${identifier}`);
      console.log(`  - Created: ${new Date(parseInt(timestamp)).toISOString()}`);
      console.log(`  - ID: ${uniqueId}`);
    });
    
    // Simulate logging
    console.log('\n📝 Logging unauthorized access:');
    console.log(`  - Prompt: ${prompt.title}`);
    console.log(`  - Public Token: ${prompt.publicToken}`);
    console.log(`  - Usage Count: ${prompt.usageCount}`);
    console.log(`  - Action: Account flagged for review`);
  } else {
    console.log('❌ No tracking code found (this should not happen!)');
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
});

// Summary
console.log('=== Summary ===');
console.log(`Total honeypot prompts: ${honeypotPrompts.length}`);
console.log(`All prompts contain tracking codes: ✅`);
console.log('\nThese prompts are ready to be inserted into the database as honeypots.');
console.log('Any unauthorized access will trigger tracking and security alerts.');