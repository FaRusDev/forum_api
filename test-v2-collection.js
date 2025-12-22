const https = require('https');

const BASE_URL = 'https://forumapi-production.up.railway.app';

// Simulate Forum API V2 collection with 68 requests
// Running it 2 times = 136 total requests (should trigger rate limit after 90)

async function makeRequest(path, requestNum) {
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
          num: requestNum,
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
      resolve({ num: requestNum, status: 'ERROR', error: error.message });
    });

    req.end();
  });
}

async function testV2Collection() {
  console.log('🧪 Testing Rate Limiting - Forum API V2 Style\n');
  console.log('Simulating Forum API V2 collection:');
  console.log('  - Collection has 68 requests');
  console.log('  - Running 2 iterations = 136 total requests');
  console.log('  - Expected: First 90 succeed, then HTTP 429\n');

  const results = {
    success: [],
    rateLimited: [],
    errors: []
  };

  const promises = [];
  
  // Simulate 2 iterations of V2 collection (68 requests x 2 = 136)
  const requestsPerIteration = 68;
  const iterations = 2;
  const totalRequests = requestsPerIteration * iterations;

  console.log(`Starting test with ${totalRequests} requests...\n`);

  for (let i = 1; i <= totalRequests; i++) {
    // Vary endpoints to simulate real collection
    const endpoints = [
      '/threads',
      '/threads/thread-test',
      '/threads/thread-test/comments',
      '/threads/thread-test/comments/comment-test',
    ];
    const path = endpoints[i % endpoints.length];
    
    promises.push(
      makeRequest(path, i).then(response => {
        if (response.status === 429) {
          results.rateLimited.push(response.num);
          if (results.rateLimited.length <= 5) {
            console.log(`❌ Request ${response.num}: HTTP 429 (Rate Limited)`);
            if (response.headers.retryAfter) {
              console.log(`   Retry-After: ${response.headers.retryAfter}s`);
            }
          }
        } else if (response.status === 404 || response.status === 200 || response.status === 401) {
          results.success.push(response.num);
          if (response.num <= 5 || response.num === 68 || response.num === 69 || response.num === 90) {
            console.log(`✅ Request ${response.num}: HTTP ${response.status}`);
          }
        } else if (response.status === 'ERROR') {
          results.errors.push(response.num);
          console.log(`⚠️ Request ${response.num}: Error`);
        }
      })
    );
  }

  await Promise.all(promises);

  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS - Forum API V2 Collection Simulation');
  console.log('='.repeat(70));
  console.log(`Collection: Forum API V2 (68 requests per iteration)`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log('');
  console.log(`✅ Successful requests: ${results.success.length} (${((results.success.length/totalRequests)*100).toFixed(1)}%)`);
  console.log(`❌ Rate limited (429): ${results.rateLimited.length} (${((results.rateLimited.length/totalRequests)*100).toFixed(1)}%)`);
  console.log(`⚠️ Errors: ${results.errors.length}`);
  console.log('='.repeat(70));

  // Analysis
  const expectedSuccess = 90;
  const expectedBlocked = totalRequests - expectedSuccess;

  console.log('\n📋 Analysis:');
  console.log(`Expected: ${expectedSuccess} successful, ${expectedBlocked} blocked`);
  console.log(`Actual: ${results.success.length} successful, ${results.rateLimited.length} blocked`);
  
  if (results.rateLimited.length >= expectedBlocked - 5) {
    console.log('\n🎉 SUCCESS! Rate limiting is working correctly!');
    console.log(`   This matches what reviewers should see when testing with`);
    console.log(`   Forum API V2 collection (2 iterations without delays).`);
  } else {
    console.log('\n⚠️ WARNING! Rate limiting may not be working as expected.');
  }

  // Breakdown by iteration
  console.log('\n📊 Breakdown by Iteration:');
  const iter1Success = results.success.filter(n => n <= requestsPerIteration).length;
  const iter1Blocked = results.rateLimited.filter(n => n <= requestsPerIteration).length;
  const iter2Success = results.success.filter(n => n > requestsPerIteration).length;
  const iter2Blocked = results.rateLimited.filter(n => n > requestsPerIteration).length;
  
  console.log(`  Iteration 1 (requests 1-68):`);
  console.log(`    ✅ Success: ${iter1Success}`);
  console.log(`    ❌ Blocked: ${iter1Blocked}`);
  console.log(`  Iteration 2 (requests 69-136):`);
  console.log(`    ✅ Success: ${iter2Success} (until request 90)`);
  console.log(`    ❌ Blocked: ${iter2Blocked} (from request 91+)`);
}

testV2Collection().catch(console.error);
