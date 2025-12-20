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
5. ✅ Execute 151 automated tests
6. ✅ Generate test coverage report

**Status:** [![CI/CD](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml/badge.svg)](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml)

### Continuous Deployment (CD)
**Platform:** Railway.app  
**Configuration:** `.github/workflows/cd.yml` (documentation)  
**Trigger:** Automatic on push to `main` branch

**CD Process:**
1. ✅ Railway detects push to main
2. ✅ Pull latest code from GitHub
3. ✅ Install production dependencies
4. ✅ Run database migrations (`Procfile`)
5. ✅ Start application
6. ✅ Health check & traffic routing

**Live URL:** https://forumapi-production.up.railway.app

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
- **Configuration:** `nginx.conf`
- **Rate Limiting:** 
  - `/threads` endpoints: **90 requests/minute per IP**
  - Other endpoints: No rate limiting
- **Security Headers:** X-Frame-Options, X-XSS-Protection, CSP
- **HTTPS Only:** Enforced via Railway SSL

### Authentication & Authorization
- **JWT-based authentication**
- Access token & refresh token
- Protected endpoints require valid Bearer token
- Users can only delete their own resources

## License

ISC
