const http = require('http');

const BASE_URL = '18.142.114.158';
const PATH = '/threads';

let passCount = 0;
let failCount = 0;

function makeRequest(requestNum) {
  return new Promise((resolve) => {
    const options = {
      hostname: BASE_URL,
      port: 80,
      path: PATH,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 429) {
        failCount++;
        console.log(`Request ${requestNum}: ❌ RATE LIMITED (429)`);
      } else {
        passCount++;
        console.log(`Request ${requestNum}: ✅ SUCCESS (${res.statusCode})`);
      }
      resolve();
    });

    req.on('error', (e) => {
      console.error(`Request ${requestNum}: ERROR - ${e.message}`);
      resolve();
    });

    req.end();
  });
}

async function testRateLimit() {
  console.log('🚀 Testing Rate Limiting on AWS EC2...\n');
  console.log(`Target: http://${BASE_URL}${PATH}`);
  console.log(`Total Requests: 100`);
  console.log(`Expected Limit: 90 requests/minute (Nginx)\n`);

  const promises = [];
  for (let i = 1; i <= 100; i++) {
    promises.push(makeRequest(i));
  }

  await Promise.all(promises);

  console.log('\n📊 RESULTS:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Rate Limited: ${failCount}`);
  
  if (failCount >= 5) {
    console.log(`\n🎉 RATE LIMITING WORKS! Nginx is blocking excess requests.`);
  } else {
    console.log(`\n⚠️ Rate limiting might not be working properly.`);
  }
}

testRateLimit();
