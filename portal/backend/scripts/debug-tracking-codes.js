/**
 * Debug tracking codes in honeypot prompts
 */

const fs = require('fs');

// Load the generated honeypot prompts
const honeypotPrompts = JSON.parse(fs.readFileSync('honeypot-prompts.json', 'utf8'));

console.log('Debugging Tracking Codes in Honeypot Prompts\n');

honeypotPrompts.forEach((prompt, index) => {
  console.log(`\n${index + 1}. ${prompt.title}`);
  
  // Find all zero-width spaces and their positions
  const content = prompt.content;
  const zeroWidthPositions = [];
  
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 0x200B) { // Zero-width space
      zeroWidthPositions.push(i);
    }
  }
  
  console.log(`   Zero-width spaces found at positions: ${zeroWidthPositions.join(', ')}`);
  
  // Extract text between zero-width spaces
  if (zeroWidthPositions.length >= 2) {
    for (let i = 0; i < zeroWidthPositions.length - 1; i++) {
      const start = zeroWidthPositions[i] + 1;
      const end = zeroWidthPositions[i + 1];
      const extracted = content.substring(start, end);
      console.log(`   Extracted between positions ${start}-${end}: "${extracted}"`);
    }
  }
  
  // Show the actual content around tracking codes
  const searchTerms = ['api-security', 'frontend-opt', 'db-optimization', 'microservices', 'ai-integration'];
  searchTerms.forEach(term => {
    const index = content.indexOf(term);
    if (index !== -1) {
      const contextStart = Math.max(0, index - 20);
      const contextEnd = Math.min(content.length, index + term.length + 20);
      const context = content.substring(contextStart, contextEnd);
      console.log(`   Found "${term}" in context: "${context}"`);
      
      // Show character codes around the term
      const charCodes = [];
      for (let i = contextStart; i < contextEnd; i++) {
        if (content.charCodeAt(i) === 0x200B) {
          charCodes.push(`[ZWS]`);
        } else {
          charCodes.push(content[i]);
        }
      }
      console.log(`   With markers: ${charCodes.join('')}`);
    }
  });
});