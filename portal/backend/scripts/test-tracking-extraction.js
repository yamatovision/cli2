/**
 * Test tracking code extraction from honeypot prompts
 */

const { extractTrackingCode } = require('./generate-honeypot-prompts');
const fs = require('fs');

// Load the generated honeypot prompts
const honeypotPrompts = JSON.parse(fs.readFileSync('honeypot-prompts.json', 'utf8'));

console.log('Testing Tracking Code Extraction\n');

honeypotPrompts.forEach((prompt, index) => {
  console.log(`${index + 1}. ${prompt.title}`);
  
  const trackingCodes = extractTrackingCode(prompt.content);
  
  if (trackingCodes) {
    console.log('   Tracking codes found:');
    trackingCodes.forEach(code => {
      const parts = code.split('-');
      console.log(`     - Identifier: ${parts[0]}`);
      console.log(`     - Timestamp: ${new Date(parseInt(parts[1])).toISOString()}`);
      console.log(`     - Unique ID: ${parts[2]}`);
    });
  } else {
    console.log('   No tracking codes found');
  }
  console.log();
});

// Test with a clean prompt (no tracking)
console.log('\nTesting with clean prompt:');
const cleanContent = 'This is a normal prompt without any tracking codes.';
const cleanResult = extractTrackingCode(cleanContent);
console.log(`Clean prompt tracking: ${cleanResult ? 'Found' : 'Not found'}`);

// Test manual extraction of invisible characters
console.log('\nChecking for invisible characters in content:');
honeypotPrompts.forEach((prompt, index) => {
  const invisibleChars = prompt.content.match(/[\u200B-\u200F\u2028-\u202E]/g);
  if (invisibleChars) {
    console.log(`${prompt.title}: ${invisibleChars.length} invisible characters found`);
  }
});