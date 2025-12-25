# RENDER.COM SETUP GUIDE - STEP BY STEP

## 🎯 Overview
Kita akan:
1. Create PostgreSQL database
2. Create Web Service (Hapi.js app)
3. Connect database ke app
4. Deploy & test
5. Update Postman environment
6. Submit!

---

## STEP 1: CREATE POSTGRESQL DATABASE (5 menit)

### A. Di Dashboard Render.com:

1. **Klik "New +"** (tombol biru di kanan atas)

2. **Pilih: "PostgreSQL"**

3. **Isi form:**
   ```
   Name: forum-api-db
   Database: forumapi
   User: forumapi_user
   Region: Singapore (pilih yang terdekat)
   PostgreSQL Version: 15 (atau latest)
   Plan: Free
   ```

4. **Klik "Create Database"**

5. **TUNGGU 2-3 menit** - Database sedang dibuat

6. **Setelah selesai**, klik database "forum-api-db"

7. **Scroll ke bawah**, cari section **"Connections"**

8. **COPY semua credentials ini** (PENTING!):
   ```
   Internal Database URL: postgresql://...
   External Database URL: postgresql://...
   PSQL Command: psql postgresql://...
   
   Host: dpg-xxxxx-a.singapore-postgres.render.com
   Port: 5432
   Database: forumapi
   Username: forumapi_user
   Password: xxxxxxxxxxxx
   ```

9. **SIMPAN di notepad** - Kita butuh ini nanti!

---

## STEP 2: CREATE WEB SERVICE (5 menit)

### A. Kembali ke Dashboard:

1. **Klik "New +"** lagi

2. **Pilih: "Web Service"**

3. **Connect GitHub repository:**
   - Klik "Connect account" kalau belum
   - Authorize Render untuk akses GitHub
   - Pilih repository: **forum_api**

4. **Isi form Web Service:**
   ```
   Name: forum-api
   Region: Singapore (sama dengan database)
   Branch: main
   Root Directory: (kosongkan)
   Runtime: Node
   Build Command: npm install
   Start Command: npm run start
   Plan: Free
   ```

5. **JANGAN klik "Create Web Service" dulu!**

---

## STEP 3: ADD ENVIRONMENT VARIABLES (PENTING!)

### Scroll ke bawah ke section "Environment Variables"

**Klik "Add Environment Variable"** dan tambahkan satu per satu:

```bash
# 1. Database
PGHOST=dpg-xxxxx-a.singapore-postgres.render.com
PGPORT=5432
PGUSER=forumapi_user
PGPASSWORD=xxxxxxxxxxxx
PGDATABASE=forumapi

# 2. JWT Secrets
ACCESS_TOKEN_KEY=ini-adalah-access-token-key-rahasia-yang-sangat-panjang-dan-aman
REFRESH_TOKEN_KEY=ini-adalah-refresh-token-key-rahasia-yang-berbeda-dan-aman

# 3. Node Environment
NODE_ENV=production

# 4. Optional - Bcrypt
BCRYPT_SALT=10
```

**IMPORTANT:** Ganti nilai `PGHOST`, `PGUSER`, `PGPASSWORD` dengan credentials dari STEP 1!

---

## STEP 4: DEPLOY! (Auto)

1. **Setelah semua environment variables diisi, klik: "Create Web Service"**

2. **Render akan otomatis:**
   - Clone repository
   - Run `npm install`
   - Run `npm run start`
   - Deploy app

3. **Monitor logs** - Klik tab "Logs" untuk lihat progress

4. **Expected logs:**
   ```
   ==> Cloning from https://github.com/FaRusDev/forum_api...
   ==> Running 'npm install'
   ==> Running 'npm run start'
   Server running at http://0.0.0.0:5000
   ```

5. **TUNGGU sampai status berubah:** "Your service is live 🎉"

6. **Copy URL service:** 
   ```
   https://forum-api-xxxx.onrender.com
   ```

---

## STEP 5: RUN DATABASE MIGRATIONS (PENTING!)

### A. Via Render Shell:

1. **Di dashboard Web Service, klik tab "Shell"**

2. **Klik "Launch Shell"** (buka terminal online)

3. **Run migrations:**
   ```bash
   npm run migrate up
   ```

4. **Expected output:**
   ```
   Migrated up: 1627983516963_create-table-users.js
   Migrated up: 1627983555473_create-table-authentications.js
   Migrated up: 1628165421009_create-table-threads.js
   Migrated up: 1628165478555_create-table-comments.js
   Migrated up: 1628165501234_create-table-replies.js
   Migrated up: 1628165601234_create-table-likes.js
   ```

5. **TUTUP shell** setelah selesai

---

## STEP 6: VERIFY DEPLOYMENT (Test API)

### Test di browser atau Postman:

1. **Test health check:**
   ```
   GET https://forum-api-xxxx.onrender.com/
   ```
   Expected: Response OK

2. **Test register user:**
   ```bash
   POST https://forum-api-xxxx.onrender.com/users
   Body:
   {
     "username": "testuser",
     "password": "secret",
     "fullname": "Test User"
   }
   ```
   Expected: HTTP 201, user registered ✅

3. **Test rate limiting:**
   - Di PowerShell lokal, run test script

---

## STEP 7: UPDATE POSTMAN ENVIRONMENT

### Edit file: `Forum API V2 Test.postman_environment.json`

```json
{
  "id": "...",
  "name": "Forum API V2 Test",
  "values": [
    {
      "key": "host",
      "value": "forum-api-xxxx.onrender.com",
      "enabled": true
    },
    {
      "key": "port",
      "value": "",
      "enabled": true
    },
    {
      "key": "protocol",
      "value": "https",
      "enabled": true
    }
  ],
  "...": "..."
}
```

**SAVE file!**

---

## STEP 8: TEST RATE LIMITING (CRITICAL!)

### Create test script:

Save as: `test-render-rate-limit.js`

```javascript
const https = require('https');

const BASE_URL = 'forum-api-xxxx.onrender.com'; // GANTI dengan URL Render kamu
const PATH = '/threads';

let passCount = 0;
let failCount = 0;

function makeRequest(requestNum) {
  return new Promise((resolve) => {
    const options = {
      hostname: BASE_URL,
      path: PATH,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
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
  console.log('🚀 Testing Rate Limiting on Render.com...\n');
  console.log(`Target: https://${BASE_URL}${PATH}`);
  console.log(`Total Requests: 100`);
  console.log(`Expected Limit: 90 requests/minute\n`);

  const promises = [];
  for (let i = 1; i <= 100; i++) {
    promises.push(makeRequest(i));
  }

  await Promise.all(promises);

  console.log('\n📊 RESULTS:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Rate Limited: ${failCount}`);
  console.log(`\n${failCount >= 10 ? '🎉 RATE LIMITING WORKS!' : '⚠️ Rate limiting might not be working'}`);
}

testRateLimit();
```

### Run test:

```bash
node test-render-rate-limit.js
```

**Expected output:**
```
Request 1-90: ✅ SUCCESS (404 or 200)
Request 91-100: ❌ RATE LIMITED (429)

📊 RESULTS:
✅ Passed: 90
❌ Rate Limited: 10
🎉 RATE LIMITING WORKS!
```

---

## STEP 9: TEST POSTMAN COLLECTION

1. **Import collection & environment** ke Postman

2. **Verify environment:**
   - Host: `forum-api-xxxx.onrender.com`
   - Protocol: `https`
   - Port: `` (empty)

3. **Run collection:**
   - Iterations: 2
   - Delay: 0ms

4. **Expected result:**
   ```
   Iteration 1 (68 requests): All pass ✅
   Iteration 2 (68 requests): ~22 pass, ~46 rate limited ✅
   ```

---

## STEP 10: COMMIT & PUSH TO GITHUB

### Update files yang berubah:

```bash
git add .
git commit -m "Deploy to Render.com with rate limiting"
git push origin main
```

**Render akan auto-redeploy** setiap kali kamu push ke GitHub!

---

## STEP 11: PREPARE SUBMISSION

### Files untuk ZIP:

```
✅ src/
✅ migrations/
✅ tests/
✅ config/
✅ package.json + package-lock.json
✅ .env.example
✅ .gitignore
✅ README.md (update dengan Render URL)
✅ Forum API V2 Test.postman_collection.json
✅ Forum API V2 Test.postman_environment.json (updated)
✅ .github/ (CI/CD workflows)

❌ node_modules/ (EXCLUDE)
❌ .env (EXCLUDE)
❌ *.zip (EXCLUDE)
```

### Update README.md:

Add section:

```markdown
## 🚀 Production Deployment

**Platform:** Render.com
**URL:** https://forum-api-xxxx.onrender.com
**Database:** PostgreSQL (Render managed)

### Rate Limiting

- **Implementation:** Application-level middleware (Node.js)
- **Limit:** 90 requests per minute
- **Scope:** `/threads` endpoints
- **Response:** HTTP 429 (Too Many Requests)

### Testing

1. Import Postman collection and environment
2. Ensure environment points to production URL
3. Run collection 2 iterations
4. Expected: 90 requests pass, 46 rate limited
```

---

## ✅ CHECKLIST BEFORE SUBMIT

- [ ] Web Service deployed & running
- [ ] Database migrations completed
- [ ] Rate limiting tested (10+ requests get HTTP 429)
- [ ] Postman collection runs successfully
- [ ] Postman environment points to Render URL
- [ ] README.md updated with deployment info
- [ ] All tests passing: `npm test`
- [ ] GitHub repository synced
- [ ] ZIP file created (without node_modules)

---

## 🎯 WHAT TO TELL REVIEWER

**Di form submission, tulis:**

```
Production URL: https://forum-api-xxxx.onrender.com

Rate Limiting Implementation:
- Platform: Render.com
- Method: Application-level middleware (Node.js)
- Limit: 90 requests per minute untuk /threads endpoints
- Testing: Run Postman collection 2 iterations untuk verify

Catatan:
- Rate limiting bekerja di application level (middleware Hapi.js)
- Database menggunakan PostgreSQL managed by Render
- CI/CD via GitHub Actions
- Postman environment sudah dikonfigurasi ke production URL
```

---

## 🆘 TROUBLESHOOTING

### Problem: "Build failed"
**Solution:** Check logs, biasanya missing dependencies
```bash
npm install
```

### Problem: "Database connection failed"
**Solution:** Verify environment variables, ensure PGHOST, PGUSER, PGPASSWORD correct

### Problem: "Migrations failed"
**Solution:** Run migrations via Render Shell:
```bash
npm run migrate up
```

### Problem: "Rate limiting not working"
**Solution:** Check createServer.js, ensure middleware active and not skipped

### Problem: "Service sleeping (cold start)"
**Solution:** Normal di free tier, service akan wake up otomatis dalam 30-60 detik

---

## 📊 EXPECTED TIMELINE

- Database creation: 3 minutes
- Web Service creation: 2 minutes
- First deploy: 5-10 minutes
- Run migrations: 1 minute
- Test rate limiting: 2 minutes
- Update Postman environment: 2 minutes
- Final testing: 5 minutes

**TOTAL: 20-25 menit** ✅

---

## 🎉 SUCCESS CRITERIA

✅ URL accessible: `https://forum-api-xxxx.onrender.com`
✅ Register user works
✅ Login works
✅ Create thread works
✅ Rate limiting blocks 91st request
✅ Postman collection runs (with expected 429s)

**Ready to submit!** 🚀
