# FLY.IO SETUP GUIDE - NO CREDIT CARD NEEDED! 🎉

## ✅ Why Fly.io?

1. ✅ **NO CREDIT CARD** required for free tier
2. ✅ **PostgreSQL included** (3 volumes gratis)
3. ✅ **Full control** - Rate limiting pasti bekerja
4. ✅ **Always on** - Tidak sleep seperti Railway
5. ✅ **HTTPS otomatis**
6. ✅ **CLI-based** - Professional workflow

---

## 📋 PREREQUISITES

### 1. Install Fly.io CLI

**Windows (PowerShell):**

```powershell
# Download installer
iwr https://fly.io/install.ps1 -useb | iex
```

**Atau manual download:**
- https://fly.io/docs/hands-on/install-flyctl/
- Download flyctl-windows.zip
- Extract ke folder (misal: C:\flyctl)
- Add ke PATH

### 2. Verify Installation

```powershell
flyctl version
```

Expected output: `flyctl v0.x.xxx`

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: Login/Sign Up ke Fly.io (2 menit)

```powershell
flyctl auth signup
```

**Atau kalau sudah punya akun:**

```powershell
flyctl auth login
```

Browser akan terbuka → Login → Authorize

**IMPORTANT:** Fly.io **TIDAK perlu credit card** untuk free tier! 🎉

---

### STEP 2: Prepare Project Files (5 menit)

#### A. Create `fly.toml` (Fly.io config)

Di root project, create file: `fly.toml`

```toml
app = "forum-api-v2"
primary_region = "sin"  # Singapore

[build]
  [build.args]
    NODE_VERSION = "18"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20
```

#### B. Create `Dockerfile`

```dockerfile
# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "run", "start"]
```

#### C. Create `.dockerignore`

```
node_modules
.git
.env
*.log
*.md
*.zip
tests
.github
.vscode
coverage
```

#### D. Update `package.json` - Add start script (jika belum ada)

Check dulu apakah sudah ada `start` script:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "start:dev": "nodemon src/app.js",
    "test": "jest --config=jest.config.js",
    "migrate": "node-pg-migrate"
  }
}
```

Kalau belum ada `"start"`, tambahkan!

---

### STEP 3: Launch App (5 menit)

```powershell
# Navigate to project directory
cd "c:\Users\Rusandy\Downloads\forum-api-starter-project (2)"

# Launch app (auto-detect Node.js)
flyctl launch
```

**Interactive prompts akan muncul:**

```
? Choose an app name (leave blank to generate one): forum-api-v2
? Choose a region for deployment: Singapore (sin)
? Would you like to set up a Postgresql database now? Yes
? Select configuration: Development - Single node, 1x shared CPU, 256MB RAM, 1GB disk
? Would you like to set up an Upstash Redis database now? No
? Create .dockerignore from .gitignore files? Yes
? Would you like to deploy now? No (we need to setup env vars first)
```

**IMPORTANT:** 
- Pilih **YES** untuk PostgreSQL
- Pilih **Development** config (gratis)
- Pilih **NO** untuk Redis
- Pilih **NO** untuk deploy now (setup env vars dulu)

---

### STEP 4: Get Database Credentials (2 menit)

Fly.io otomatis create PostgreSQL dan inject credentials!

**Check database:**

```powershell
flyctl postgres list
```

**Get connection string:**

```powershell
flyctl postgres db list -a forum-api-v2-db
```

**ATAU lihat secrets (sudah auto-injected):**

```powershell
flyctl secrets list
```

Output:
```
DATABASE_URL    postgresql://postgres:xxxx@top2.nearest.of.forum-api-v2-db.internal:5432/forum_api_v2?sslmode=disable
```

**SAVE ini!** Tapi sebenarnya sudah otomatis ter-inject ke app sebagai `DATABASE_URL`

---

### STEP 5: Set Environment Variables (3 menit)

**Set secrets satu per satu:**

```powershell
flyctl secrets set ACCESS_TOKEN_KEY="ini-adalah-access-token-key-rahasia-yang-sangat-panjang-dan-aman" -a forum-api-v2

flyctl secrets set REFRESH_TOKEN_KEY="ini-adalah-refresh-token-key-rahasia-yang-berbeda-dan-aman" -a forum-api-v2

flyctl secrets set NODE_ENV="production" -a forum-api-v2

flyctl secrets set BCRYPT_SALT="10" -a forum-api-v2
```

**ATAU set sekaligus:**

```powershell
flyctl secrets set ACCESS_TOKEN_KEY="ini-adalah-access-token-key-rahasia-yang-sangat-panjang-dan-aman" REFRESH_TOKEN_KEY="ini-adalah-refresh-token-key-rahasia-yang-berbeda-dan-aman" NODE_ENV="production" BCRYPT_SALT="10" -a forum-api-v2
```

**Note:** `DATABASE_URL` sudah otomatis di-set oleh Fly.io!

---

### STEP 6: Update Database Connection Code (IMPORTANT!)

Fly.io inject `DATABASE_URL` (bukan `PGHOST`, `PGPORT`, dll terpisah).

**Edit: `src/Infrastructures/database/postgres/pool.js`**

Check apakah sudah support `DATABASE_URL`:

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
      connectionString: process.env.DATABASE_URL,  // ← Fly.io uses this
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

module.exports = pool;
```

**Kalau belum ada `DATABASE_URL` support, update file!**

---

### STEP 7: Update Migrations Config

**Edit: `config/database/database.json`**

Tambahkan support untuk `DATABASE_URL`:

```json
{
  "test": {
    "driver": "pg",
    "host": { "ENV": "PGHOST_TEST" },
    "port": { "ENV": "PGPORT_TEST" },
    "user": { "ENV": "PGUSER_TEST" },
    "password": { "ENV": "PGPASSWORD_TEST" },
    "database": { "ENV": "PGDATABASE_TEST" }
  },
  "production": {
    "driver": "pg",
    "database_url": { "ENV": "DATABASE_URL" }
  }
}
```

---

### STEP 8: Deploy App! (5 menit)

```powershell
flyctl deploy -a forum-api-v2
```

**Fly.io akan:**
1. Build Docker image
2. Push image
3. Deploy container
4. Start app

**Monitor logs:**

```powershell
flyctl logs -a forum-api-v2
```

Expected:
```
Server running at http://0.0.0.0:8080
```

---

### STEP 9: Run Database Migrations (CRITICAL!)

**Option A: Via Fly.io Console (SSH)**

```powershell
flyctl ssh console -a forum-api-v2
```

Setelah masuk console:

```bash
npm run migrate up
```

Expected output:
```
Migrated up: 1627983516963_create-table-users.js
Migrated up: 1627983555473_create-table-authentications.js
... (all migrations)
```

**Exit:**
```bash
exit
```

**Option B: Via Local (jika Option A error)**

```powershell
# Proxy database ke local
flyctl proxy 5432:5432 -a forum-api-v2-db
```

Buka terminal baru:

```powershell
# Set env vars temporarily
$env:PGHOST="localhost"
$env:PGPORT="5432"
$env:PGUSER="postgres"
$env:PGPASSWORD="<password-from-DATABASE_URL>"
$env:PGDATABASE="forum_api_v2"

# Run migrations
npm run migrate up
```

---

### STEP 10: Get App URL & Test

```powershell
flyctl status -a forum-api-v2
```

Output:
```
Hostname: forum-api-v2.fly.dev
```

**Test API:**

```powershell
# Test health
Invoke-WebRequest -Uri "https://forum-api-v2.fly.dev/" -Method GET

# Test register
$body = @{
    username = "testuser"
    password = "secret"
    fullname = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://forum-api-v2.fly.dev/users" -Method POST -Body $body -ContentType "application/json"
```

---

### STEP 11: Test Rate Limiting (5 menit)

Create: `test-flyio-rate-limit.js`

```javascript
const https = require('https');

const BASE_URL = 'forum-api-v2.fly.dev'; // GANTI dengan app name kamu
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
  console.log('🚀 Testing Rate Limiting on Fly.io...\n');
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
  console.log(`\n${failCount >= 10 ? '🎉 RATE LIMITING WORKS!' : '⚠️ Check rate limiting config'}`);
}

testRateLimit();
```

**Run test:**

```powershell
node test-flyio-rate-limit.js
```

**Expected:**
```
Request 1-90: ✅ SUCCESS
Request 91-100: ❌ RATE LIMITED (429)
```

---

### STEP 12: Update Postman Environment

**Edit: `Forum API V2 Test.postman_environment.json`**

```json
{
  "key": "host",
  "value": "forum-api-v2.fly.dev",
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

**Save & test collection!**

---

## 🎯 FINAL CHECKLIST

- [ ] Fly.io CLI installed
- [ ] `flyctl auth login` success
- [ ] `fly.toml` created
- [ ] `Dockerfile` created
- [ ] `.dockerignore` created
- [ ] Database created (auto via `flyctl launch`)
- [ ] Environment variables set
- [ ] App deployed (`flyctl deploy`)
- [ ] Migrations run (`npm run migrate up`)
- [ ] Rate limiting tested (10+ get HTTP 429)
- [ ] Postman environment updated
- [ ] Postman collection runs successfully

---

## 📦 COMMIT & PUSH

```powershell
git add .
git commit -m "Deploy to Fly.io with PostgreSQL and rate limiting"
git push origin main
```

---

## 🆘 TROUBLESHOOTING

### Problem: "flyctl: command not found"
**Solution:** Restart PowerShell or add to PATH manually

### Problem: "Database connection failed"
**Solution:** Check `pool.js` uses `DATABASE_URL`

### Problem: "Migrations failed"
**Solution:** Run via SSH console:
```bash
flyctl ssh console -a forum-api-v2
npm run migrate up
```

### Problem: "Rate limiting not working"
**Solution:** Check `createServer.js` middleware is active

---

## 💰 FLY.IO FREE TIER LIMITS

✅ **3 shared-cpu-1x VMs** (256MB RAM each)
✅ **3GB persistent volume storage**
✅ **160GB outbound data transfer**
✅ **No credit card required!**

Perfect untuk demo/submission! 🎉

---

## 🚀 DEPLOYMENT COMMANDS CHEAT SHEET

```powershell
# Deploy
flyctl deploy -a forum-api-v2

# View logs
flyctl logs -a forum-api-v2

# Check status
flyctl status -a forum-api-v2

# SSH into container
flyctl ssh console -a forum-api-v2

# List apps
flyctl apps list

# Scale (if needed)
flyctl scale count 1 -a forum-api-v2

# Update secrets
flyctl secrets set KEY=VALUE -a forum-api-v2

# View secrets
flyctl secrets list -a forum-api-v2

# Restart app
flyctl apps restart forum-api-v2
```

---

## ✅ SUCCESS CRITERIA

✅ URL: `https://forum-api-v2.fly.dev`
✅ Register user works
✅ Login works
✅ Create thread works
✅ Rate limiting: 91st request gets HTTP 429
✅ Postman collection runs with expected rate limits

**READY TO SUBMIT!** 🎉

---

## 📊 ESTIMATED TIME

- Install CLI: 2 min
- Sign up/login: 2 min
- Create config files: 5 min
- Launch & setup: 5 min
- Deploy: 5 min
- Migrations: 2 min
- Testing: 5 min
- Update Postman: 2 min

**TOTAL: 28 minutes** ✅

**NO CREDIT CARD NEEDED!** 🎉
