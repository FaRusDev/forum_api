const https = require('https');

const BASE_URL = 'https://forumapi-production.up.railway.app';

async function makeRequest(path, id) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          id,
          status: res.statusCode,
          headers: {
            limit: res.headers['x-ratelimit-limit'],
            remaining: res.headers['x-ratelimit-remaining'],
            retryAfter: res.headers['retry-after']
          }
        });
      });
    });

    req.on('error', (error) => {
      resolve({ id, status: 'ERROR', error: error.message });
    });

    req.end();
  });
}

async function aggressiveTest() {
  console.log('🔥 AGGRESSIVE Rate Limiting Test\n');
  console.log('Sending 150 rapid requests to verify rate limiting');
  console.log('Expected: 90 pass, 60 blocked (HTTP 429)\n');

  const results = {
    success: [],
    rateLimited: [],
    errors: []
  };

  const promises = [];
  
  // Send 150 requests as fast as possible
  for (let i = 1; i <= 150; i++) {
    promises.push(
      makeRequest('/threads', i).then(response => {
        if (response.status === 429) {
          results.rateLimited.push(response.id);
          if (results.rateLimited.length <= 3) {
            console.log(`❌ Request ${response.id}: HTTP 429 (Rate Limited)`);
            console.log(`   Retry-After: ${response.headers.retryAfter} seconds`);
          }
        } else if (response.status === 404 || response.status === 200 || response.status === 401) {
          results.success.push(response.id);
          if (results.success.length <= 3 || response.id <= 3) {
            console.log(`✅ Request ${response.id}: HTTP ${response.status}`);
            if (response.headers.remaining) {
              console.log(`   Remaining: ${response.headers.remaining}/${response.headers.limit}`);
            }
          }
        } else if (response.status === 'ERROR') {
          results.errors.push(response.id);
          console.log(`⚠️ Request ${response.id}: Error - ${response.error}`);
        }
      })
    );
  }

  await Promise.all(promises);

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS:');
  console.log('='.repeat(60));
  console.log(`✅ Successful requests: ${results.success.length}`);
  console.log(`❌ Rate limited (429): ${results.rateLimited.length}`);
  console.log(`⚠️ Errors: ${results.errors.length}`);
  console.log(`📈 Total: ${results.success.length + results.rateLimited.length + results.errors.length}`);
  console.log('='.repeat(60));

  // Analysis
  const expectedBlocked = 60; // 150 - 90 = 60
  const tolerance = 5; // Allow some variance due to timing

  if (results.rateLimited.length >= expectedBlocked - tolerance) {
    console.log('\n🎉 SUCCESS! Rate limiting is working correctly!');
    console.log(`   ${results.rateLimited.length} out of ${150 - 90} expected requests were blocked.`);
    console.log('   This proves the GLOBAL 90 req/min limit is enforced.');
  } else {
    console.log('\n⚠️ WARNING! Rate limiting may not be strict enough.');
    console.log(`   Only ${results.rateLimited.length} requests blocked (expected ~${expectedBlocked}).`);
  }

  // Show which requests were blocked
  if (results.rateLimited.length > 0) {
    console.log(`\n📋 First 10 blocked request numbers: ${results.rateLimited.slice(0, 10).join(', ')}`);
    console.log(`📋 Last 10 blocked request numbers: ${results.rateLimited.slice(-10).join(', ')}`);
  }
}

aggressiveTest().catch(console.error);
