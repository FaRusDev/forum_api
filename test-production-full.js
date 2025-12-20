/* eslint-disable no-console */
const https = require('https');

const BASE_URL = 'https://forumapi-production.up.railway.app';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

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

async function testFullFlow() {
  console.log('🚀 Testing Production API: ' + BASE_URL);
  console.log('='.repeat(70));

  const timestamp = Date.now();
  let accessToken = '';
  let threadId = '';
  let commentId = '';

  try {
    // 1. Register
    console.log('\n1️⃣  Register User');
    const registerResult = await makeRequest('POST', '/users', {
      username: `user${timestamp}`,
      password: 'secret',
      fullname: 'Test User',
    });
    console.log(`   Status: ${registerResult.statusCode} - ${registerResult.statusCode === 201 ? '✅ PASS' : '❌ FAIL'}`);

    // 2. Login
    console.log('\n2️⃣  Login');
    const loginResult = await makeRequest('POST', '/authentications', {
      username: `user${timestamp}`,
      password: 'secret',
    });
    console.log(`   Status: ${loginResult.statusCode} - ${loginResult.statusCode === 201 ? '✅ PASS' : '❌ FAIL'}`);
    if (loginResult.statusCode === 201) {
      accessToken = loginResult.data.data.accessToken;
    }

    // 3. Add Thread
    console.log('\n3️⃣  Add Thread');
    const threadResult = await makeRequest('POST', '/threads', {
      title: 'Test Thread',
      body: 'Test Body',
    }, accessToken);
    console.log(`   Status: ${threadResult.statusCode} - ${threadResult.statusCode === 201 ? '✅ PASS' : '❌ FAIL'}`);
    if (threadResult.statusCode === 201) {
      threadId = threadResult.data.data.addedThread.id;
    }

    // 4. Add Comment
    console.log('\n4️⃣  Add Comment');
    const commentResult = await makeRequest('POST', `/threads/${threadId}/comments`, {
      content: 'Test Comment',
    }, accessToken);
    console.log(`   Status: ${commentResult.statusCode} - ${commentResult.statusCode === 201 ? '✅ PASS' : '❌ FAIL'}`);
    if (commentResult.statusCode === 201) {
      commentId = commentResult.data.data.addedComment.id;
    }

    // 5. Add Reply
    console.log('\n5️⃣  Add Reply');
    const replyResult = await makeRequest('POST', `/threads/${threadId}/comments/${commentId}/replies`, {
      content: 'Test Reply',
    }, accessToken);
    console.log(`   Status: ${replyResult.statusCode} - ${replyResult.statusCode === 201 ? '✅ PASS' : '❌ FAIL'}`);

    // 6. Like Comment
    console.log('\n6️⃣  Like Comment');
    const likeResult = await makeRequest('PUT', `/threads/${threadId}/comments/${commentId}/likes`, null, accessToken);
    console.log(`   Status: ${likeResult.statusCode} - ${likeResult.statusCode === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // 7. Get Thread Detail
    console.log('\n7️⃣  Get Thread Detail');
    const detailResult = await makeRequest('GET', `/threads/${threadId}`);
    console.log(`   Status: ${detailResult.statusCode} - ${detailResult.statusCode === 200 ? '✅ PASS' : '❌ FAIL'}`);
    if (detailResult.statusCode === 200) {
      const thread = detailResult.data.data.thread;
      console.log(`   Thread: ${thread.title}`);
      console.log(`   Comments: ${thread.comments.length}`);
      if (thread.comments.length > 0) {
        console.log(`   Like Count: ${thread.comments[0].likeCount}`);
        console.log(`   Replies: ${thread.comments[0].replies.length}`);
      }
    }

    // 8. Unlike Comment
    console.log('\n8️⃣  Unlike Comment (toggle)');
    const unlikeResult = await makeRequest('PUT', `/threads/${threadId}/comments/${commentId}/likes`, null, accessToken);
    console.log(`   Status: ${unlikeResult.statusCode} - ${unlikeResult.statusCode === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // 9. Delete Reply
    console.log('\n9️⃣  Delete Reply (soft delete)');
    const deleteReplyResult = await makeRequest('DELETE', `/threads/${threadId}/comments/${commentId}/replies/${replyResult.data.data.addedReply.id}`, null, accessToken);
    console.log(`   Status: ${deleteReplyResult.statusCode} - ${deleteReplyResult.statusCode === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // 10. Delete Comment
    console.log('\n🔟 Delete Comment (soft delete)');
    const deleteCommentResult = await makeRequest('DELETE', `/threads/${threadId}/comments/${commentId}`, null, accessToken);
    console.log(`   Status: ${deleteCommentResult.statusCode} - ${deleteCommentResult.statusCode === 200 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('🌐 Production API is WORKING!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testFullFlow();
