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

  // Global rate limiting for /threads endpoints
  const globalRateLimit = {
    count: 0,
    resetTime: Date.now() + 60000,
  };
  const RATE_LIMIT = 90;
  const RATE_WINDOW = 60000; // 1 minute

  // Rate limiting middleware - GLOBAL (not per-IP)
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
      const response = h.response({
        status: 'fail',
        message: 'Too Many Requests. Rate limit: 90 requests per minute for /threads endpoints (global limit).',
      }).code(429);
      response.header('X-RateLimit-Limit', RATE_LIMIT);
      response.header('X-RateLimit-Remaining', 0);
      response.header('X-RateLimit-Reset', globalRateLimit.resetTime);
      return response.takeover();
    }

    // Increment global counter
    globalRateLimit.count += 1;
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
