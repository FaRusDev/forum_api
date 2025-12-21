const Hapi = require("@hapi/hapi")
const Jwt = require("@hapi/jwt")
const HapiRateLimit = require("hapi-rate-limit")
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

  // Simple in-memory rate limiting for /threads endpoints
  const rateLimitStore = new Map();
  const RATE_LIMIT = 90;
  const RATE_WINDOW = 60000; // 1 minute

  // Rate limiting middleware
  server.ext('onRequest', (request, h) => {
    // Only apply to /threads endpoints
    if (!request.path.startsWith('/threads')) {
      return h.continue;
    }

    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      return h.continue;
    }

    // Get IP from Railway proxy headers or remoteAddress
    const userKey = request.headers['x-forwarded-for']?.split(',')[0]?.trim() 
                    || request.info.remoteAddress 
                    || 'unknown';
    const now = Date.now();
    
    if (!rateLimitStore.has(userKey)) {
      rateLimitStore.set(userKey, { count: 1, resetTime: now + RATE_WINDOW });
      return h.continue;
    }

    const userData = rateLimitStore.get(userKey);
    
    if (now > userData.resetTime) {
      // Reset window
      rateLimitStore.set(userKey, { count: 1, resetTime: now + RATE_WINDOW });
      return h.continue;
    }

    if (userData.count >= RATE_LIMIT) {
      const response = h.response({
        status: 'fail',
        message: 'Too Many Requests. Rate limit: 90 requests per minute for /threads endpoints.',
      }).code(429);
      response.header('X-RateLimit-Limit', RATE_LIMIT);
      response.header('X-RateLimit-Remaining', 0);
      response.header('X-RateLimit-Reset', userData.resetTime);
      return response.takeover();
    }

    userData.count += 1;
    rateLimitStore.set(userKey, userData);
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
