const https = require('https');

const PROD_URL = 'https://forumapi-production.up.railway.app';

// Test rate limiting by hitting /threads endpoint rapidly
async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting on /threads endpoint...\n');
  console.log('Rate limit: 90 requests/minute');
  console.log('Testing with 100 rapid requests (should trigger 429 error)\n');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  
  const promises = [];
  
  // Send 100 requests rapidly
  for (let i = 0; i < 100; i++) {
    const promise = new Promise((resolve) => {
      const req = https.get(`${PROD_URL}/threads/thread-123`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 429) {
            rateLimitedCount++;
            console.log(`❌ Request ${i + 1}: Rate limited (429)`);
          } else if (res.statusCode === 404) {
            successCount++;
            if (i < 5 || i > 95) {
              console.log(`✅ Request ${i + 1}: Success (${res.statusCode})`);
            } else if (i === 5) {
              console.log(`... (showing first 5 and last 5 requests)`);
            }
          } else {
            successCount++;
            console.log(`✅ Request ${i + 1}: Status ${res.statusCode}`);
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        errorCount++;
        console.log(`⚠️ Request ${i + 1}: Error - ${err.message}`);
        resolve();
      });
      
      req.end();
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  
  console.log('\n📊 Results:');
  console.log(`   ✅ Successful requests: ${successCount}`);
  console.log(`   ❌ Rate limited (429): ${rateLimitedCount}`);
  console.log(`   ⚠️ Errors: ${errorCount}`);
  console.log(`   📈 Total: ${successCount + rateLimitedCount + errorCount}`);
  
  if (rateLimitedCount > 0) {
    console.log('\n🎉 SUCCESS! Rate limiting is working correctly!');
    console.log(`   ${rateLimitedCount} requests were blocked by rate limiter.`);
  } else {
    console.log('\n⚠️ WARNING! No rate limiting detected.');
    console.log('   All 100 requests succeeded without hitting the rate limit.');
  }
}

testRateLimit().catch(console.error);
