# KOYEB SETUP GUIDE - NO CREDIT CARD! 🎉

## ✅ Why Koyeb?

1. ✅ **NO CREDIT CARD** - Benar-benar gratis!
2. ✅ **Free tier generous** - 2 services gratis
3. ✅ **Easy setup** - Web UI friendly
4. ✅ **HTTPS otomatis**
5. ✅ **Deploy dari GitHub**
6. ✅ **PostgreSQL via Neon** (also free, no credit card)

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: Sign Up ke Koyeb (2 menit)

1. Go to: **https://www.koyeb.com/**
2. **Click "Sign Up" atau "Get Started"**
3. **Sign up with GitHub** (paling mudah)
4. **NO CREDIT CARD** required! ✅

---

### STEP 2: Sign Up ke Neon (PostgreSQL) (3 menit)

Koyeb tidak include PostgreSQL, jadi kita pakai **Neon** (gratis, no credit card).

1. Go to: **https://neon.tech/**
2. **Click "Sign Up"**
3. **Sign up with GitHub**
4. **NO CREDIT CARD** required! ✅

#### Create PostgreSQL Database:

1. After login, click **"Create Project"**
2. **Project name:** `forum-api`
3. **Region:** Singapore (atau terdekat)
4. **PostgreSQL version:** 15 (default OK)
5. **Click "Create Project"**

#### Get Connection String:

1. Setelah project created, kamu akan lihat **"Connection Details"**
2. **Copy "Connection string":**
   ```
   postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/forumapi?sslmode=require
   ```
3. **SAVE ini!** Kita butuh untuk Koyeb environment variables

---

### STEP 3: Prepare Project Files (5 menit)

#### A. Create `Dockerfile`

Di root project, create file: `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]
```

#### B. Update `package.json` - Ensure start script exists

```json
{
  "scripts": {
    "start": "node src/app.js",
    "start:dev": "nodemon src/app.js",
    "test": "jest",
    "migrate": "node-pg-migrate"
  }
}
```

#### C. Update Database Connection - Support DATABASE_URL

**Edit: `src/Infrastructures/database/postgres/pool.js`**

Ensure it supports `DATABASE_URL`:

```javascript
const { Pool } = require('pg');

const testConfig = {
  host: process.env.PGHOST_TEST,
  port: process.env.PGPORT_TEST,
  user: process.env.PGUSER_TEST,
  password: process.env.PGPASSWORD_TEST,
  database: process.env.PGDATABASE_TEST,
};

const pool = process.env.NODE_ENV === 'test'
  ? new Pool(testConfig)
  : new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

module.exports = pool;
```

---

### STEP 4: Push to GitHub (2 menit)

```powershell
git add .
git commit -m "Prepare for Koyeb deployment"
git push origin main
```

---

### STEP 5: Deploy to Koyeb (5 menit)

#### A. Create Service:

1. Di Koyeb dashboard, click **"Create Service"**
2. **Select "GitHub"**
3. **Authorize Koyeb** untuk akses GitHub
4. **Select repository:** `forum_api`
5. **Select branch:** `main`

#### B. Configure Build:

```
Builder: Dockerfile
Dockerfile path: ./Dockerfile
```

#### C. Configure Deployment:

```
Service name: forum-api
Region: Singapore (atau terdekat)
Instance type: Nano (Free tier)
Scaling: 1 instance
Port: 5000 (internal port yang di-expose di Dockerfile)
```

#### D. Add Environment Variables:

Click **"Add Environment Variable"**, tambahkan satu per satu:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/forumapi?sslmode=require

ACCESS_TOKEN_KEY=ini-adalah-access-token-key-rahasia-yang-sangat-panjang-dan-aman

REFRESH_TOKEN_KEY=ini-adalah-refresh-token-key-rahasia-yang-berbeda-dan-aman

NODE_ENV=production

BCRYPT_SALT=10

PORT=5000
```

**IMPORTANT:** Ganti `DATABASE_URL` dengan connection string dari Neon (STEP 2)!

#### E. Health Check (Optional tapi recommended):

```
Health check path: /
Protocol: HTTP
Port: 5000
```

#### F. Deploy:

Click **"Deploy"** dan tunggu 3-5 menit

---

### STEP 6: Run Database Migrations (CRITICAL!)

#### Option A: Via Koyeb Console (jika tersedia)

1. Di Koyeb dashboard, click service "forum-api"
2. Click **"Console"** atau **"Shell"** (jika ada)
3. Run: `npm run migrate up`

#### Option B: Via Local Connection

1. Install `psql` (PostgreSQL client) atau use npm script

2. **Set environment variables temporarily:**

```powershell
$env:DATABASE_URL="postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/forumapi?sslmode=require"
```

3. **Run migrations:**

```powershell
npm run migrate up
```

Expected output:
```
Migrated up: 1627983516963_create-table-users.js
Migrated up: 1627983555473_create-table-authentications.js
... (all migrations)
```

---

### STEP 7: Get App URL

1. Di Koyeb dashboard, click service "forum-api"
2. Copy **"Public URL":**
   ```
   https://forum-api-<your-username>.koyeb.app
   ```
3. **SAVE URL ini!**

---

### STEP 8: Test API

```powershell
# Test health
Invoke-WebRequest -Uri "https://forum-api-<your-username>.koyeb.app/" -Method GET

# Test register
$body = @{
    username = "testuser"
    password = "secret"
    fullname = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://forum-api-<your-username>.koyeb.app/users" -Method POST -Body $body -ContentType "application/json"
```

---

### STEP 9: Test Rate Limiting

Create: `test-koyeb-rate-limit.js`

```javascript
const https = require('https');

const BASE_URL = 'forum-api-<your-username>.koyeb.app'; // GANTI!
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
  console.log('🚀 Testing Rate Limiting on Koyeb...\n');
  console.log(`Target: https://${BASE_URL}${PATH}`);
  console.log(`Total Requests: 100\n`);

  const promises = [];
  for (let i = 1; i <= 100; i++) {
    promises.push(makeRequest(i));
  }

  await Promise.all(promises);

  console.log('\n📊 RESULTS:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Rate Limited: ${failCount}`);
  console.log(`\n${failCount >= 10 ? '🎉 RATE LIMITING WORKS!' : '⚠️ Check config'}`);
}

testRateLimit();
```

**Run:**
```powershell
node test-koyeb-rate-limit.js
```

---

### STEP 10: Update Postman Environment

**Edit: `Forum API V2 Test.postman_environment.json`**

```json
{
  "key": "host",
  "value": "forum-api-<your-username>.koyeb.app",
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
```

**Save & test!**

---

## 🎯 FINAL CHECKLIST

- [ ] Koyeb account created (no credit card)
- [ ] Neon PostgreSQL created (no credit card)
- [ ] Dockerfile created
- [ ] pool.js supports DATABASE_URL
- [ ] Code pushed to GitHub
- [ ] Service deployed on Koyeb
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Rate limiting tested
- [ ] Postman environment updated
- [ ] Collection runs successfully

---

## 💰 FREE TIER DETAILS

**Koyeb Free:**
- ✅ 2 services
- ✅ Shared vCPU
- ✅ 512MB RAM per service
- ✅ HTTPS included
- ✅ **NO CREDIT CARD!**

**Neon Free:**
- ✅ 1 project
- ✅ 10 branches
- ✅ 3GB storage
- ✅ Compute: 100 hours/month
- ✅ **NO CREDIT CARD!**

---

## 🆘 TROUBLESHOOTING

### Problem: "Build failed"
**Solution:** Check Dockerfile, ensure all dependencies in package.json

### Problem: "Database connection failed"
**Solution:** 
- Verify DATABASE_URL in environment variables
- Ensure pool.js has SSL config: `ssl: { rejectUnauthorized: false }`

### Problem: "Migrations failed"
**Solution:** Run manually via local with DATABASE_URL env var

### Problem: "Service not accessible"
**Solution:** Check Port in Dockerfile matches Koyeb config (5000)

---

## ✅ SUCCESS CRITERIA

✅ URL: `https://forum-api-<your-username>.koyeb.app`
✅ Register works
✅ Login works
✅ Create thread works
✅ Rate limiting: 91st request gets HTTP 429
✅ Postman collection runs

**READY TO SUBMIT!** 🎉

---

## 📊 TIMELINE

- Koyeb signup: 2 min
- Neon signup + DB: 3 min
- Prepare files: 5 min
- Push to GitHub: 2 min
- Deploy to Koyeb: 5 min
- Run migrations: 2 min
- Testing: 5 min
- Update Postman: 2 min

**TOTAL: 26 minutes** ✅

**100% FREE - NO CREDIT CARD!** 🎉
