/**
 * Verify JSON encoding of tracking codes
 */

const fs = require('fs');

// Test 1: Create a string with zero-width spaces
const testString = `This is a test​tracking-code-123-abc​with invisible markers`;
console.log('Original string length:', testString.length);
console.log('Contains zero-width spaces:', testString.includes('\u200B'));

// Test 2: Save to JSON and reload
const testData = { content: testString };
fs.writeFileSync('test-encoding.json', JSON.stringify(testData, null, 2));

// Reload and check
const loaded = JSON.parse(fs.readFileSync('test-encoding.json', 'utf8'));
console.log('\nAfter JSON round-trip:');
console.log('Loaded string length:', loaded.content.length);
console.log('Contains zero-width spaces:', loaded.content.includes('\u200B'));

// Test 3: Check honeypot prompts file
console.log('\n\nChecking honeypot-prompts.json:');
const honeypotPrompts = JSON.parse(fs.readFileSync('honeypot-prompts.json', 'utf8'));

honeypotPrompts.forEach((prompt, index) => {
  const hasZWS = prompt.content.includes('\u200B');
  const zwsCount = (prompt.content.match(/\u200B/g) || []).length;
  console.log(`${index + 1}. ${prompt.title}`);
  console.log(`   Has zero-width spaces: ${hasZWS}`);
  console.log(`   Zero-width space count: ${zwsCount}`);
  
  // Try to find tracking pattern manually
  const match = prompt.content.match(/\u200B([a-zA-Z0-9\-]+)\u200B/);
  if (match) {
    console.log(`   Found tracking code: ${match[1]}`);
  }
});