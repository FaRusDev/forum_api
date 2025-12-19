# Forum API

[![CI/CD](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml/badge.svg)](https://github.com/FaRusDev/forum_api/actions/workflows/ci.yml)

Back-End API untuk aplikasi forum diskusi dengan fitur thread, comment, dan reply.

**🌐 Live API:** https://forumapi-production.up.railway.app

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

## CI/CD

Project ini menggunakan GitHub Actions untuk:
- ✅ Automated testing
- ✅ Code quality checks
- ✅ Automated deployment

## License

ISC
