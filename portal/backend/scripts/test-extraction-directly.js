// Test extraction directly
const fs = require('fs');

// Direct extraction function
function extractTrackingCode(content) {
  const pattern = /\u200B([a-zA-Z0-9\-]+)\u200B/g;
  const matches = [];
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    const trackingCode = match[1];
    if (trackingCode.includes('-') && trackingCode.split('-').length === 3) {
      matches.push(trackingCode);
    }
  }
  
  return matches.length > 0 ? matches : null;
}

// Load and test
const honeypotPrompts = JSON.parse(fs.readFileSync('honeypot-prompts.json', 'utf8'));
const testContent = honeypotPrompts[0].content;

console.log('Testing direct extraction:');
console.log('Content length:', testContent.length);
console.log('Has zero-width spaces:', testContent.includes('\u200B'));

const result = extractTrackingCode(testContent);
console.log('Extraction result:', result);

// Test with simple pattern
const simpleMatch = testContent.match(/\u200B([a-zA-Z0-9\-]+)\u200B/);
console.log('\nSimple match result:', simpleMatch ? simpleMatch[1] : 'No match');