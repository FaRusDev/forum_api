const https = require('https');

const PROD_URL = 'https://forumapi-production.up.railway.app';

// Test rate limiting with collection-style requests (multiple different endpoints)
async function testCollectionRateLimit() {
  console.log('🧪 Testing Rate Limiting - Collection Style (Multiple Endpoints)...\n');
  console.log('Rate limit: 90 requests/minute PER USER (IP)');
  console.log('Testing with 100 requests to DIFFERENT /threads endpoints\n');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  
  const promises = [];
  
  // Simulate Postman collection: Multiple different endpoints
  const endpoints = [
    '/threads/thread-1',
    '/threads/thread-2', 
    '/threads/thread-3',
    '/threads/thread-4',
    '/threads/thread-5',
  ];
  
  // Send 100 requests to different endpoints (like Postman collection)
  for (let i = 0; i < 100; i++) {
    const endpoint = endpoints[i % endpoints.length];
    
    const promise = new Promise((resolve) => {
      const req = https.get(`${PROD_URL}${endpoint}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 429) {
            rateLimitedCount++;
            if (rateLimitedCount <= 5 || rateLimitedCount > 95) {
              console.log(`❌ Request ${i + 1} to ${endpoint}: Rate limited (429)`);
            } else if (rateLimitedCount === 6) {
              console.log(`... (showing first 5 and last 5 rate limited requests)`);
            }
          } else if (res.statusCode === 404 || res.statusCode === 200) {
            successCount++;
            if (i < 5 || i > 95) {
              console.log(`✅ Request ${i + 1} to ${endpoint}: Success (${res.statusCode})`);
            } else if (i === 5) {
              console.log(`... (showing first 5 and last 5 successful requests)`);
            }
          } else {
            successCount++;
            console.log(`✅ Request ${i + 1} to ${endpoint}: Status ${res.statusCode}`);
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        errorCount++;
        console.log(`⚠️ Request ${i + 1} to ${endpoint}: Error - ${err.message}`);
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
    console.log('\n🎉 SUCCESS! Rate limiting is working!');
    console.log(`   ${rateLimitedCount} requests were blocked across different endpoints.`);
    console.log(`   This proves rate limit applies per-user, not per-path.`);
  } else {
    console.log('\n⚠️ WARNING! No rate limiting detected across multiple endpoints.');
    console.log('   All requests succeeded. Rate limiting may not be working correctly.');
  }
}

testCollectionRateLimit().catch(console.error);
