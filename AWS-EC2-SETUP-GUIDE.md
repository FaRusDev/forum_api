# AWS EC2 SETUP GUIDE - FREE TIER (12 Months)

## 🎯 Overview

Kita akan setup:
1. ✅ EC2 t2.micro instance (Ubuntu)
2. ✅ PostgreSQL database
3. ✅ Nginx reverse proxy with rate limiting
4. ✅ Node.js + Hapi.js application
5. ✅ HTTPS via Let's Encrypt (optional)

**Total setup time:** 45-60 menit (first time)

---

## 📋 PREREQUISITES

### 1. AWS Account
- Sign up: https://aws.amazon.com/free/
- Credit card required untuk verifikasi (TIDAK akan dicharge di Free Tier)
- Email & phone verification

### 2. Domain Name (OPTIONAL tapi recommended untuk HTTPS)
- Bisa pakai domain gratis dari Freenom.com
- Atau pakai IP public langsung (tapi HTTP only)

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: Create EC2 Instance (10 menit)

#### A. Login ke AWS Console:
1. Go to: https://console.aws.amazon.com/
2. Login dengan AWS account

#### B. Launch EC2 Instance:

1. **Service** → **EC2** → **Launch Instance**

2. **Name:** `forum-api-server`

3. **Application and OS Images (AMI):**
   - Choose: **Ubuntu Server 22.04 LTS** (Free tier eligible)
   - Architecture: **64-bit (x86)**

4. **Instance type:**
   - Choose: **t2.micro** (Free tier eligible)
   - 1 vCPU, 1 GB RAM

5. **Key pair (login):**
   - Click "Create new key pair"
   - Key pair name: `forum-api-key`
   - Key pair type: **RSA**
   - Private key format: **.pem** (untuk SSH)
   - **Download dan SIMPAN file .pem ini!** (Tidak bisa download lagi!)

6. **Network settings:**
   - Click "Edit"
   - **Auto-assign public IP:** Enable
   - **Security group:** Create new
     - Security group name: `forum-api-sg`
     - Description: `Security group for Forum API`
   
   **Add rules:**
   - ✅ **SSH** (port 22) - Source: My IP (atau 0.0.0.0/0 untuk akses dari mana saja)
   - ✅ **HTTP** (port 80) - Source: 0.0.0.0/0 (akses dari internet)
   - ✅ **HTTPS** (port 443) - Source: 0.0.0.0/0 (optional, untuk SSL nanti)
   - ✅ **Custom TCP** (port 5000) - Source: 0.0.0.0/0 (untuk test Hapi server langsung)

7. **Configure storage:**
   - Size: **30 GB** (Free tier limit)
   - Volume type: **gp3** (general purpose SSD)

8. **Advanced details:** (skip, use default)

9. **Summary:** Review semua settings

10. **Launch instance** → Wait 1-2 menit

#### C. Get Public IP:

1. Go to **EC2 Dashboard** → **Instances**
2. Select instance "forum-api-server"
3. Copy **Public IPv4 address** (misal: `54.123.45.67`)
4. **SAVE IP ini!** Ini yang akan kita gunakan

---

### STEP 2: Connect to EC2 via SSH (5 menit)

#### A. Windows (PowerShell):

1. **Move .pem file ke folder yang aman:**
   ```powershell
   mkdir C:\Users\Rusandy\.ssh
   Move-Item -Path "C:\Users\Rusandy\Downloads\forum-api-key.pem" -Destination "C:\Users\Rusandy\.ssh\forum-api-key.pem"
   ```

2. **Set permissions (penting!):**
   ```powershell
   icacls "C:\Users\Rusandy\.ssh\forum-api-key.pem" /inheritance:r
   icacls "C:\Users\Rusandy\.ssh\forum-api-key.pem" /grant:r "$($env:USERNAME):(R)"
   ```

3. **Connect via SSH:**
   ```powershell
   ssh -i "C:\Users\Rusandy\.ssh\forum-api-key.pem" ubuntu@54.123.45.67
   ```
   
   Ganti `54.123.45.67` dengan Public IP instance kamu!

4. **First time prompt:** Type `yes` dan Enter

5. **Kalau berhasil, kamu akan lihat:**
   ```
   ubuntu@ip-172-31-xx-xx:~$
   ```

**✅ Sekarang kamu sudah masuk ke server EC2!**

---

### STEP 3: Install Dependencies (10 menit)

#### A. Update system:

```bash
sudo apt update && sudo apt upgrade -y
```

#### B. Install Node.js 18 LTS:

```bash
# Install Node.js repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or 10.x.x
```

#### C. Install PostgreSQL:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo systemctl status postgresql
```

#### D. Install Nginx:

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

#### E. Install Git:

```bash
sudo apt install -y git

# Verify
git --version
```

---

### STEP 4: Setup PostgreSQL Database (5 menit)

```bash
# Switch to postgres user
sudo -u postgres psql

# Dalam psql prompt (postgres=#):
```

**Run commands di psql:**

```sql
-- Create database
CREATE DATABASE forumapi;

-- Create user
CREATE USER forumapi_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE forumapi TO forumapi_user;

-- Exit psql
\q
```

**Test connection:**

```bash
psql -U forumapi_user -d forumapi -h localhost
# Password: your_secure_password_here

# Kalau berhasil masuk, exit:
\q
```

---

### STEP 5: Clone & Setup Application (5 menit)

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/FaRusDev/forum_api.git

# Navigate to project
cd forum_api

# Install dependencies
npm install

# Create .env file
nano .env
```

**Isi .env file:**

```bash
# Database Configuration
PGHOST=localhost
PGPORT=5432
PGUSER=forumapi_user
PGPASSWORD=your_secure_password_here
PGDATABASE=forumapi

# JWT Configuration
ACCESS_TOKEN_KEY=ini-adalah-access-token-key-rahasia-yang-sangat-panjang-dan-aman
REFRESH_TOKEN_KEY=ini-adalah-refresh-token-key-rahasia-yang-berbeda-dan-aman

# Node Environment
NODE_ENV=production

# Bcrypt
BCRYPT_SALT=10
```

**Save file:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

---

### STEP 6: Run Database Migrations (2 menit)

```bash
npm run migrate up
```

**Expected output:**
```
Migrated up: 1627983516963_create-table-users.js
Migrated up: 1627983555473_create-table-authentications.js
... (all migrations)
```

---

### STEP 7: Test Application (2 menit)

```bash
# Start app
npm run start
```

**Expected output:**
```
Server running at http://0.0.0.0:5000
```

**Test dari browser atau PowerShell local:**

```powershell
# Test dari local Windows
Invoke-WebRequest -Uri "http://54.123.45.67:5000/" -Method GET
```

**Kalau berhasil** = ✅ Application running!

**Stop server** (Ctrl + C di SSH) - Kita akan setup PM2 untuk keep running

---

### STEP 8: Setup PM2 (Process Manager) (3 menit)

PM2 = Keep application running 24/7, auto-restart kalau crash

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start npm --name "forum-api" -- run start

# Save PM2 process list
pm2 save

# Setup PM2 auto-start on boot
pm2 startup
# Copy dan run command yang muncul (misal: sudo env PATH=$PATH:... pm2 startup systemd -u ubuntu --hp /home/ubuntu)

# Check status
pm2 status
pm2 logs forum-api
```

**Application sekarang running 24/7!** ✅

---

### STEP 9: Configure Nginx with Rate Limiting (10 menit)

#### A. Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/forum-api
```

**Paste config ini:**

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=90r/m;

# Upstream (Hapi server)
upstream forum_api {
    server localhost:5000;
}

# HTTP Server
server {
    listen 80;
    server_name 54.123.45.67;  # Ganti dengan Public IP kamu!

    # Logs
    access_log /var/log/nginx/forum-api-access.log;
    error_log /var/log/nginx/forum-api-error.log;

    # Rate limiting untuk /threads endpoints
    location /threads {
        # Apply rate limit
        limit_req zone=api_limit burst=5 nodelay;
        limit_req_status 429;

        # Proxy ke Hapi server
        proxy_pass http://forum_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Semua endpoint lain (tanpa rate limit)
    location / {
        proxy_pass http://forum_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Save file** (Ctrl + X, Y, Enter)

#### B. Enable site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/forum-api /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### STEP 10: Test Everything! (5 menit)

#### A. Test dari local (PowerShell):

```powershell
# Test health
Invoke-WebRequest -Uri "http://54.123.45.67/" -Method GET

# Test register
$body = @{
    username = "testuser"
    password = "secret"
    fullname = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://54.123.45.67/users" -Method POST -Body $body -ContentType "application/json"
```

#### B. Test rate limiting:

Create file di local: `test-aws-rate-limit.js`

```javascript
const http = require('http');

const BASE_URL = '54.123.45.67'; // Ganti dengan Public IP kamu!
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
  console.log(`Total Requests: 100\n`);

  const promises = [];
  for (let i = 1; i <= 100; i++) {
    promises.push(makeRequest(i));
  }

  await Promise.all(promises);

  console.log('\n📊 RESULTS:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Rate Limited: ${failCount}`);
  console.log(`\n${failCount >= 5 ? '🎉 RATE LIMITING WORKS!' : '⚠️ Check Nginx config'}`);
}

testRateLimit();
```

**Run test:**

```powershell
node test-aws-rate-limit.js
```

**Expected result:**
- First 90-95 requests: SUCCESS (404 or 200 OK)
- Remaining requests: RATE LIMITED (429)

---

### STEP 11: Update Postman Environment

**Edit: `Forum API V2 Test.postman_environment.json`**

```json
{
  "key": "host",
  "value": "54.123.45.67",
  "enabled": true
},
{
  "key": "port",
  "value": "80",
  "enabled": true
},
{
  "key": "protocol",
  "value": "http",
  "enabled": true
}
```

**Ganti `54.123.45.67` dengan Public IP EC2 kamu!**

---

### STEP 12: (OPTIONAL) Setup HTTPS dengan Let's Encrypt

Kalau kamu punya domain, bisa setup HTTPS:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (ganti example.com dengan domain kamu)
sudo certbot --nginx -d example.com

# Follow prompts, pilih option untuk redirect HTTP ke HTTPS

# Test SSL renewal
sudo certbot renew --dry-run
```

Update Postman environment ke `https` dan port `443`.

---

## 🎯 FINAL CHECKLIST

- [ ] EC2 instance running (t2.micro, Ubuntu 22.04)
- [ ] SSH connection working
- [ ] Node.js 18 installed
- [ ] PostgreSQL installed & database created
- [ ] Nginx installed
- [ ] Application cloned & dependencies installed
- [ ] Database migrations run
- [ ] PM2 running application (24/7)
- [ ] Nginx configured with rate limiting
- [ ] Rate limiting tested (10+ requests blocked)
- [ ] Postman environment updated with Public IP
- [ ] Collection runs successfully

---

## 💰 AWS FREE TIER LIMITS

✅ **750 hours/month** EC2 t2.micro (12 months)
✅ **30GB** EBS storage
✅ **15GB** data transfer OUT per month
⚠️ **Exceeded limits = charges apply!**

**To avoid charges:**
- Stop instance when not needed
- Monitor usage in AWS Billing Dashboard
- Set billing alerts

---

## 🆘 TROUBLESHOOTING

### Problem: "Permission denied (publickey)"
**Solution:** Check .pem file permissions, use correct username (`ubuntu`)

### Problem: "Connection refused port 5000"
**Solution:** Check Security Group rules, ensure port 5000 open

### Problem: "Nginx 502 Bad Gateway"
**Solution:** 
```bash
pm2 status  # Check if app running
pm2 logs forum-api  # Check errors
sudo nginx -t  # Test nginx config
```

### Problem: "Database connection failed"
**Solution:** Check .env file, ensure PostgreSQL running:
```bash
sudo systemctl status postgresql
```

### Problem: "Rate limiting not working"
**Solution:** Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/forum-api-error.log
```

---

## 🔒 SECURITY BEST PRACTICES

1. **Change SSH port** dari 22 ke custom port (optional)
2. **Disable root login** via SSH
3. **Setup firewall** (ufw):
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```
4. **Regular updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
5. **Setup fail2ban** untuk protect SSH:
   ```bash
   sudo apt install fail2ban -y
   ```

---

## 📊 USEFUL COMMANDS

```bash
# Check PM2 status
pm2 status
pm2 logs forum-api
pm2 restart forum-api

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# Check PostgreSQL
sudo systemctl status postgresql
psql -U forumapi_user -d forumapi -h localhost

# Check disk space
df -h

# Check memory
free -h

# Check running processes
htop
```

---

## ✅ SUCCESS CRITERIA

✅ URL: `http://54.123.45.67`
✅ Register user works
✅ Login works
✅ Create thread works
✅ Rate limiting: 91st+ request gets HTTP 429
✅ Postman collection runs successfully
✅ Server running 24/7 via PM2
✅ Nginx logs show rate limiting in action

**READY TO SUBMIT!** 🎉

---

## 📊 TIMELINE

- Create EC2 instance: 10 min
- SSH setup: 5 min
- Install dependencies: 10 min
- Setup PostgreSQL: 5 min
- Clone & setup app: 5 min
- Run migrations: 2 min
- Test app: 2 min
- Setup PM2: 3 min
- Configure Nginx: 10 min
- Test everything: 5 min
- Update Postman: 2 min

**TOTAL: 59 minutes** ✅

**100% WORKING - FULL CONTROL!** 🎉
