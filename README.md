# Forum API

[![CI/CD](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml/badge.svg)](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml)
[![Deploy to Railway](https://img.shields.io/badge/Deploy-Railway-blueviolet?logo=railway)](https://forumapi-production.up.railway.app)
[![Production Status](https://img.shields.io/badge/Status-Live-success)](https://forumapi-production.up.railway.app)

Back-End API untuk aplikasi forum diskusi dengan fitur thread, comment, dan reply.

**🌐 Live API:** https://forumapi-production.up.railway.app
**📊 CI/CD Status:** Auto-deploy from GitHub to Railway

## Tech Stack

- **Node.js** v16+
- **Hapi.js** - Web framework
- **PostgreSQL** - Database
- **Jest** - Testing framework
- **JWT** - Authentication

## Features

- ✅ User Registration & Authentication
- ✅ Thread Management (CRUD)
- ✅ Comment on Thread (with soft delete)
- ✅ Reply to Comment (with soft delete)
- ✅ Clean Architecture
- ✅ Automation Testing (151 tests)

## Installation

1. Clone repository:
```bash
git clone <repository-url>
cd forum-api
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Setup database:
```bash
# Create database
createdb forumapi

# Run migrations
npm run migrate up
```

5. Run application:
```bash
npm start
```

## Testing

Run all tests:
```bash
npm test
```

## API Endpoints

### Authentication
- `POST /users` - Register new user
- `POST /authentications` - Login
- `PUT /authentications` - Refresh token
- `DELETE /authentications` - Logout

### Threads
- `POST /threads` - Create thread
- `GET /threads/{threadId}` - Get thread detail

### Comments
- `POST /threads/{threadId}/comments` - Add comment
- `DELETE /threads/{threadId}/comments/{commentId}` - Delete comment (soft delete)

### Replies
- `POST /threads/{threadId}/comments/{commentId}/replies` - Add reply
- `DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}` - Delete reply (soft delete)

## Architecture

Project menggunakan **Clean Architecture** dengan 4 layers:

1. **Domains** - Business entities & repository contracts
2. **Applications** - Use cases & business logic
3. **Infrastructures** - Implementation (database, security, server)
4. **Interfaces** - HTTP handlers & routes

## CI/CD Pipeline

### Continuous Integration (CI)
**Platform:** GitHub Actions  
**Workflow:** `.github/workflows/ci.yml`  
**Trigger:** Every push/pull request to `main` branch

**CI Process:**
1. ✅ Setup Node.js environment
2. ✅ Install dependencies (`npm ci`)
3. ✅ Setup PostgreSQL test database
4. ✅ Run database migrations
5. ✅ Execute 161 automated tests (52 test suites)
6. ✅ Generate test coverage report

**Test Coverage:**
- **Total Tests:** 161 passing
- **Test Suites:** 52 passing
- **Coverage:** All layers (Domains, Applications, Infrastructures, Interfaces)
- **Includes:** Likes feature (ToggleLikeUseCase, LikeRepository, LikeRepositoryPostgres, CommentDetail with likeCount)

**Status:** [![CI/CD](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml/badge.svg)](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml)

### Continuous Deployment (CD)
**Platform:** Railway.app + GitHub Actions  
**Workflow:** `.github/workflows/cd.yml`  
**Trigger:** Automatic on push to `main` branch

**CD Process:**
1. ✅ GitHub Actions triggered on push
2. ✅ Railway detects push and starts deployment
3. ✅ Install production dependencies
4. ✅ Run database migrations
5. ✅ Start application server
6. ✅ Execute health checks (failure & success scenarios)
7. ✅ Traffic routing to new deployment

**CD Verification:**
- **Failure Scenario Test:** Tests invalid endpoint (demonstrates error handling)
- **Success Scenario Test:** Tests valid endpoint (confirms API is responding)
- **Result:** Both scenarios verified in each deployment

**Live URL:** https://forumapi-production.up.railway.app

**View Workflow Results:** [GitHub Actions CD](https://github.com/FaRusDev/forum_api/actions/workflows/cd.yml)

## Deployment

**Production Environment:**
- **Hosting:** Railway.app
- **Database:** PostgreSQL (Railway Managed)
- **SSL/TLS:** Automatic (Railway provides HTTPS)
- **Rate Limiting:** nginx.conf configuration
- **Auto-deploy:** From `main` branch via GitHub integration

**Environment Variables:**
- Secured in Railway dashboard
- GitHub Secrets for CI/CD
- `.env` excluded from repository

## Security

### Access Control & Rate Limiting

**⚠️ IMPORTANT: Rate Limiting Implementation for Railway**

Railway menggunakan **reverse proxy dan layer edge** yang menangani request sebelum masuk ke container aplikasi. Oleh karena itu, **rate limiting TIDAK diimplementasikan di Nginx** (karena Nginx di container bukan entry point), melainkan di **level aplikasi Node.js** menggunakan custom middleware.

**Implementation Details:**
- **Location:** `src/Infrastructures/http/createServer.js`
- **Method:** Custom middleware menggunakan Hapi `server.ext('onRequest')`
- **Reason:** Sesuai arsitektur Railway, rate limiting harus di application level agar konsisten
- **Type:** GLOBAL rate limiting (shared counter across all requests)
- **Limit:** 90 requests per minute TOTAL for all /threads endpoints
- **Response:** HTTP 429 (Too Many Requests) when exceeded

**Why Application-Level Rate Limiting?**
1. Railway uses reverse proxy - Nginx in container is NOT the entry point
2. Edge layer handles requests before reaching application
3. Application-level ensures consistent enforcement
4. Works with Railway's infrastructure (no dependency on Nginx config)

**Rate Limiting Configuration:**
  - **Type:** GLOBAL rate limiting (shared across all users/IPs)
  - **Limit:** STRICT 90 requests/minute TOTAL to ALL `/threads` endpoints
  - **Enforcement:** Counts ALL requests to `/threads/*` from ANY source
  - **Behavior:** First 90 requests pass, Request 91+ immediately rejected with HTTP 429
  - **Window:** 60 seconds rolling window
  - **Scope:** ALL `/threads` endpoints and descendants:
    - `GET /threads/{id}` - Get thread detail
    - `POST /threads` - Create thread  
    - `POST /threads/{id}/comments` - Add comment
    - `DELETE /threads/{id}/comments/{id}` - Delete comment
    - `POST /threads/{id}/comments/{id}/replies` - Add reply
    - `DELETE /threads/{id}/comments/{id}/replies/{id}` - Delete reply
    - `PUT /threads/{id}/comments/{id}/likes` - Like/unlike comment
  - **Headers:** X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After
  - **Test:** Run `node test-rate-limit.js` to verify (100 requests → 90 pass, 10 blocked)

**nginx.conf Status:**
- File `nginx.conf` included as **reference/documentation only**
- NOT executed in Railway environment (Railway uses its own edge layer)
- Rate limiting actually implemented in Node.js application code

### Authentication & Authorization
- **JWT-based authentication**
- Access token & refresh token
- Protected endpoints require valid Bearer token
- Users can only delete their own resources

## Testing Rate Limiting

### For Reviewers: How to Test Rate Limiting with Postman

**⚠️ IMPORTANT SETUP:**
1. **Use Forum API V2 Collection** (includes optional Likes feature)
2. **Use Railway Production Environment** (NOT localhost)
3. Rate limiting is GLOBAL (not per-IP) - applies to ALL requests from ALL sources combined

**Step-by-Step Testing:**

1. **Import Files into Postman:**
   - Collection: `Forum API V2 Test.postman_collection.json`
   - Environment: `Forum API V2 Test - Railway Production.postman_environment.json`

2. **Select Production Environment:**
   - In Postman, select environment: "Forum API V2 Test - Railway Production"
   - Verify variables:
     - `host`: forumapi-production.up.railway.app
     - `protocol`: https
     - `port`: (empty)

3. **Run Collection WITHOUT Delays:**
   - Open Collection Runner
   - Select: "Forum API V2 Test" collection
   - Environment: "Forum API V2 Test - Railway Production"
   - **DISABLE** "Delay between requests" (set to 0ms)
   - Click "Run"

4. **Expected Results:**
   - Total requests in V2 collection: 68 requests
   - If you run collection 2 times rapidly (136 requests total):
     - First 90 requests: Success (200, 201, 404, etc.)
     - Request 91+: HTTP 429 (Too Many Requests)

2. **Automated Test Script:**
   ```bash
   node test-rate-limit.js
   ```
   Expected output: 90 successful, 10 blocked (HTTP 429)

3. **Manual Verification:**
   - Rapidly send 100 GET requests to: `https://forumapi-production.up.railway.app/threads`
   - Use Postman Runner or curl in loop
   - Response headers will show:
     - `X-RateLimit-Limit: 90`
     - `X-RateLimit-Remaining: <count>`
     - `Retry-After: <seconds>` (when rate limited)

**Why HTTP 429 (not 503)?**
- HTTP 429 = "Too Many Requests" (correct status for rate limiting)
- HTTP 503 = "Service Unavailable" (server/Railway issues)
- Our implementation returns 429 as per RFC 6585 standard

**Response Format When Rate Limited:**
```json
{
  "status": "fail",
  "message": "Too Many Requests. Rate limit: 90 requests per minute for /threads endpoints."
}
```

**Debugging Rate Limiting:**
- Check Railway logs for: `⚠️ RATE LIMIT TRIGGERED` messages
- Headers in response show remaining quota
- Rate limit resets every 60 seconds

### Automated Test Script

To verify rate limiting works in production:
```bash
node test-rate-limit.js
```

Expected result: 90 successful requests, 10 rate-limited (HTTP 429)

## License

ISC
