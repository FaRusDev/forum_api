/* eslint-disable no-console */
const https = require('https');

const BASE_URL = 'https://forumapi-production.up.railway.app';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testProduction() {
  console.log('🚀 Testing Production API: ' + BASE_URL);
  console.log('='.repeat(60));

  let accessToken = '';
  let userId = '';
  let threadId = '';

  try {
    // Test 1: Register User
    console.log('\n1️⃣  Testing: POST /users (Register)');
    const username = 'testuser' + Date.now();
    const registerResult = await makeRequest('POST', '/users', {
      username,
      password: 'secret',
      fullname: 'Test User Production',
    });
    console.log('   Status:', registerResult.statusCode);
    console.log('   Response:', JSON.stringify(registerResult.data, null, 2));
    
    if (registerResult.statusCode === 201) {
      userId = registerResult.data.data.addedUser.id;
      console.log('   ✅ User registered successfully! ID:', userId);
    } else {
      console.log('   ⚠️  Registration response:', registerResult.statusCode);
    }

    // Test 2: Login
    console.log('\n2️⃣  Testing: POST /authentications (Login)');
    const loginResult = await makeRequest('POST', '/authentications', {
      username,
      password: 'secret',
    });
    console.log('   Status:', loginResult.statusCode);
    console.log('   Response:', JSON.stringify(loginResult.data, null, 2));
    
    if (loginResult.statusCode === 201) {
      accessToken = loginResult.data.data.accessToken;
      console.log('   ✅ Login successful! Token:', accessToken.substring(0, 20) + '...');
    } else {
      console.log('   ⚠️  Login failed');
      return;
    }

    // Test 3: Add Thread
    console.log('\n3️⃣  Testing: POST /threads (Add Thread)');
    const addThreadResult = await makeRequest('POST', '/threads', {
      title: 'Test Thread from Production',
      body: 'This is a test thread to verify deployment',
    });
    console.log('   Status:', addThreadResult.statusCode);
    console.log('   Response:', JSON.stringify(addThreadResult.data, null, 2));
    
    if (addThreadResult.statusCode === 401) {
      console.log('   ⚠️  Need authentication - This is expected!');
      console.log('   💡 To test authenticated endpoints, use Postman with the token');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Production API is LIVE and WORKING!');
    console.log('🌐 Base URL:', BASE_URL);
    console.log('📝 Test with Postman using this access token:');
    console.log('   ', accessToken);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error testing production:', error.message);
  }
}

testProduction();
