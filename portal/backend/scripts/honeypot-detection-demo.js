/**
 * Honeypot Detection Demo
 * Shows how to detect and track unauthorized access to honeypot prompts
 */

const { extractTrackingCode } = require('./generate-honeypot-prompts');

// Simulated honeypot service functions
const honeypotService = {
  // Check if content contains tracking markers
  isHoneypotContent: function(content) {
    const trackingCodes = extractTrackingCode(content);
    return trackingCodes !== null && trackingCodes.length > 0;
  },

  // Extract tracking information
  extractTrackingInfo: function(content) {
    const trackingCodes = extractTrackingCode(content);
    if (!trackingCodes) return null;

    return trackingCodes.map(code => {
      const [identifier, timestamp, uniqueId] = code.split('-');
      return {
        identifier,
        timestamp: new Date(parseInt(timestamp)),
        uniqueId,
        fullCode: code
      };
    });
  },

  // Log unauthorized access attempt
  logUnauthorizedAccess: async function(userId, promptId, trackingInfo, ipAddress, userAgent) {
    console.log('\n🚨 HONEYPOT TRIGGERED! Unauthorized Access Detected 🚨');
    console.log('═══════════════════════════════════════════════════');
    console.log(`User ID: ${userId}`);
    console.log(`Prompt ID: ${promptId}`);
    console.log(`IP Address: ${ipAddress}`);
    console.log(`User Agent: ${userAgent}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    if (trackingInfo && trackingInfo.length > 0) {
      console.log('\nTracking Information:');
      trackingInfo.forEach((info, index) => {
        console.log(`  ${index + 1}. Honeypot Type: ${info.identifier}`);
        console.log(`     Creation Time: ${info.timestamp.toISOString()}`);
        console.log(`     Unique ID: ${info.uniqueId}`);
      });
    }
    
    console.log('\nAction Taken:');
    console.log('  ✓ Access logged to security database');
    console.log('  ✓ Account flagged for review');
    console.log('  ✓ Rate limiting increased');
    console.log('  ✓ Security team notified');
    console.log('═══════════════════════════════════════════════════\n');

    // In production, this would:
    // 1. Save to security logs database
    // 2. Send alerts to security team
    // 3. Update user's security score
    // 4. Potentially trigger account restrictions
  }
};

// Demo: Simulate access to different prompts
async function demonstrateHoneypotDetection() {
  console.log('Honeypot Detection System Demo\n');

  // Load test data
  const fs = require('fs');
  const honeypotPrompts = JSON.parse(fs.readFileSync('honeypot-prompts.json', 'utf8'));
  
  // Simulate normal prompt (no tracking)
  console.log('1. Testing Normal Prompt Access:');
  const normalContent = 'This is a regular prompt without any tracking codes.';
  if (honeypotService.isHoneypotContent(normalContent)) {
    console.log('   ❌ False positive - This should not be detected!');
  } else {
    console.log('   ✅ Normal prompt - No tracking detected');
  }

  // Simulate honeypot prompt access
  console.log('\n2. Testing Honeypot Prompt Access:');
  const honeypotContent = honeypotPrompts[0].content; // API Security prompt
  console.log(`   Checking prompt: ${honeypotPrompts[0].title}`);
  if (honeypotService.isHoneypotContent(honeypotContent)) {
    console.log('   ✅ Honeypot detected!');
    const trackingInfo = honeypotService.extractTrackingInfo(honeypotContent);
    await honeypotService.logUnauthorizedAccess(
      'user123',
      honeypotPrompts[0]._id || 'prompt456',
      trackingInfo,
      '192.168.1.100',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    );
  } else {
    console.log('   ❌ Detection failed - debugging needed');
  }

  // Simulate multiple honeypot accesses
  console.log('\n3. Testing Multiple Honeypot Accesses:');
  const suspiciousUser = 'suspiciousUser789';
  const accessedPrompts = [
    honeypotPrompts[2], // Database optimization
    honeypotPrompts[4]  // AI integration
  ];

  for (const prompt of accessedPrompts) {
    if (honeypotService.isHoneypotContent(prompt.content)) {
      const trackingInfo = honeypotService.extractTrackingInfo(prompt.content);
      await honeypotService.logUnauthorizedAccess(
        suspiciousUser,
        prompt._id || `prompt-${Math.random()}`,
        trackingInfo,
        '10.0.0.50',
        'Python/3.9 requests/2.28.0'
      );
    }
  }

  // Summary
  console.log('\n4. Detection Summary:');
  console.log('   Total prompts tested: 4');
  console.log('   Normal prompts: 1');
  console.log('   Honeypot prompts detected: 3');
  console.log('   Unauthorized access attempts logged: 3');
}

// Run the demo
demonstrateHoneypotDetection();