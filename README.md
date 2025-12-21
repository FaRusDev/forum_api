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
- **Implementation:** `hapi-rate-limit` plugin in application code
- **Configuration Files:**
  - Application: `src/Infrastructures/http/createServer.js`
  - Route configuration: `src/Interfaces/http/api/threads/routes.js`, `comments/routes.js`, `replies/routes.js`, `likes/routes.js`
  - Documentation: `nginx.conf` (strict rate limiting without burst)
  
- **Rate Limiting Details:**
  - **Limit:** STRICT 90 requests/minute per IP address (no burst tolerance)
  - **Enforcement:** Any request beyond 90/minute immediately rejected with HTTP 429
  - **Scope:** `/threads` endpoint and ALL descendants:
    - `GET /threads/{id}` - Get thread detail
    - `POST /threads` - Create thread
    - `POST /threads/{id}/comments` - Add comment
    - `DELETE /threads/{id}/comments/{id}` - Delete comment
    - `POST /threads/{id}/comments/{id}/replies` - Add reply
    - `DELETE /threads/{id}/comments/{id}/replies/{id}` - Delete reply
    - `PUT /threads/{id}/comments/{id}/likes` - Like/unlike comment
  - **Behavior:** Returns HTTP 429 (Too Many Requests) when exceeded
  - **Test:** Run `node test-rate-limit.js` to verify (100 requests → 90 pass, 10 blocked)

- **Security Headers:** X-Frame-Options, X-XSS-Protection, CSP
- **HTTPS Only:** Enforced via Railway SSL

### Authentication & Authorization
- **JWT-based authentication**
- Access token & refresh token
- Protected endpoints require valid Bearer token
- Users can only delete their own resources

## Testing Rate Limiting

To verify rate limiting works in production:
```bash
node test-rate-limit.js
```

Expected result: 90 successful requests, 10 rate-limited (HTTP 429)

## License

ISC
