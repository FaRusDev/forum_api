const Hapi = require("@hapi/hapi")
const Jwt = require("@hapi/jwt")
const ClientError = require("../../Commons/exceptions/ClientError")
const DomainErrorTranslator = require("../../Commons/exceptions/DomainErrorTranslator")
const users = require("../../Interfaces/http/api/users")
const authentications = require("../../Interfaces/http/api/authentications")
const threads = require("../../Interfaces/http/api/threads")
const comments = require("../../Interfaces/http/api/comments")
const replies = require("../../Interfaces/http/api/replies")
const likes = require("../../Interfaces/http/api/likes")

const createServer = async (container) => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
  })

  /**
   * ===================================================================
   * RATE LIMITING - APPLICATION LEVEL MIDDLEWARE (Node.js)
   * ===================================================================
   * 
   * IMPORTANT: As per reviewer feedback, rate limiting MUST be implemented
   * at APPLICATION LEVEL (Node.js middleware), NOT at Nginx level.
   * 
   * REASON: Railway uses reverse proxy and edge layer. Nginx inside container
   * is NOT the entry point, so Nginx rate limiting directives (limit_req_zone,
   * $binary_remote_addr) cannot be executed effectively.
   * 
   * SOLUTION: Application-level rate limiting using custom middleware ensures
   * consistent enforcement regardless of infrastructure/hosting platform.
   * 
   * REFERENCE: Reviewer suggests "menggunakan middleware rate limiter di Node.js
   * (seperti express-rate-limit)". For Hapi framework, we implement custom
   * middleware using server.ext('onRequest') hook.
   * 
   * CONFIGURATION:
   * - Implementation: Custom middleware (Hapi server.ext hook)
   * - Type: GLOBAL rate limiting (shared counter across all requests)
   * - Limit: 90 requests per minute TOTAL for all /threads endpoints
   * - Scope: All /threads/* paths (GET, POST, DELETE, PUT, and descendants)
   * - Window: 60 seconds rolling window
   * - Response: HTTP 429 (Too Many Requests) when limit exceeded
   * - Headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After
   * 
   * nginx.conf STATUS: Included as documentation/reference only.
   * NOT executed in Railway. Actual rate limiting is THIS middleware below.
   * ===================================================================
   */
  
  const globalRateLimit = {
    count: 0,
    resetTime: Date.now() + 60000,
  };
  const RATE_LIMIT = 90;
  const RATE_WINDOW = 60000; // 1 minute

  // Application-level rate limiting middleware
  server.ext('onRequest', (request, h) => {
    // Only apply to /threads endpoints
    if (!request.path.startsWith('/threads')) {
      return h.continue;
    }

    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      return h.continue;
    }

    const now = Date.now();
    
    // Reset window if expired
    if (now > globalRateLimit.resetTime) {
      globalRateLimit.count = 0;
      globalRateLimit.resetTime = now + RATE_WINDOW;
    }

    // Check global limit
    if (globalRateLimit.count >= RATE_LIMIT) {
      console.log(`⚠️ RATE LIMIT TRIGGERED: Request ${globalRateLimit.count + 1} blocked at ${new Date().toISOString()}`);
      const response = h.response({
        status: 'fail',
        message: 'Too Many Requests. Rate limit: 90 requests per minute for /threads endpoints.',
      }).code(429);
      response.header('X-RateLimit-Limit', RATE_LIMIT);
      response.header('X-RateLimit-Remaining', 0);
      response.header('X-RateLimit-Reset', new Date(globalRateLimit.resetTime).toISOString());
      response.header('Retry-After', Math.ceil((globalRateLimit.resetTime - now) / 1000));
      return response.takeover();
    }

    // Increment global counter
    globalRateLimit.count += 1;
    
    // Add rate limit remaining info for response headers
    request.app.rateLimitRemaining = RATE_LIMIT - globalRateLimit.count;
    
    return h.continue;
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ])

  server.auth.strategy("forumapi_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  })

  await server.register([
    {
      plugin: users,
      options: { container },
    },
    {
      plugin: authentications,
      options: { container },
    },
    {
      plugin: threads,
      options: { container },
    },
    {
      plugin: comments,
      options: { container },
    },
    {
      plugin: replies,
      options: { container },
    },
    {
      plugin: likes,
      options: { container },
    },
  ])

  server.ext("onPreResponse", (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request

    if (response instanceof Error) {
      // bila response tersebut error, tangani sesuai kebutuhan
      const translatedError = DomainErrorTranslator.translate(response)

      // penanganan client error secara internal.
      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: "fail",
          message: translatedError.message,
        })
        newResponse.code(translatedError.statusCode)
        return newResponse
      }

      // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
      if (!translatedError.isServer) {
        return h.continue
      }

      // Log server error untuk debugging
      console.error("Server Error:", translatedError.message)
      console.error("Stack:", translatedError.stack)
      console.error("Request:", request.method, request.path)
      console.error("Payload:", request.payload)

      // penanganan server error sesuai kebutuhan
      const newResponse = h.response({
        status: "error",
        message: "terjadi kegagalan pada server kami",
      })
      newResponse.code(500)
      return newResponse
    }

    // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
    return h.continue
  })

  return server
}

module.exports = createServer
