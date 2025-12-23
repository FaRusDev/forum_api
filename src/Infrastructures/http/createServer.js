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

  /**
   * RATE LIMITING - APPLICATION LEVEL (Node.js Plugin)
   * 
   * Implementation: hapi-rate-limit plugin (application-level rate limiting)
   * Reason: Railway uses reverse proxy and edge layer, so Nginx-based rate limiting
   *         cannot be executed effectively. Application-level rate limiting using
   *         middleware/plugin ensures consistent enforcement regardless of infrastructure.
   * 
   * Reference: Reviewer feedback suggests using middleware like express-rate-limit
   *            for Node.js. For Hapi framework, we use hapi-rate-limit plugin.
   * 
   * Configuration:
   * - Type: GLOBAL rate limiting via pathLimit (shared across all /threads paths)
   * - Limit: 90 requests per minute for ALL /threads endpoints combined
   * - Scope: All /threads/* paths (GET, POST, DELETE, PUT)
   * - Response: HTTP 429 (Too Many Requests) when limit exceeded
   * - Headers: X-RateLimit-* headers automatically added by plugin
   */

  // Register rate limiting plugin - Application level (Node.js)
  if (process.env.NODE_ENV !== 'test') {
    await server.register({
      plugin: HapiRateLimit,
      options: {
        enabled: true,
        pathLimit: 90, // 90 requests per minute for /threads paths
        pathCache: {
          expiresIn: 60000, // 1 minute window
        },
        userLimit: false, // Disable per-user limit (we want global limit)
        userCache: false,
        headers: true, // Add X-RateLimit-* headers
        ipWhitelist: [],
        trustProxy: true, // Trust proxy headers (important for Railway)
        getIpFromProxyHeader: (header) => {
          // Railway uses x-forwarded-for header
          if (header) {
            const ips = header.split(',');
            return ips[0].trim();
          }
          return null;
        },
      },
    });

    // Apply rate limiting only to /threads endpoints
    server.ext('onRequest', (request, h) => {
      if (!request.path.startsWith('/threads')) {
        // Skip rate limiting for non-/threads endpoints
        request.plugins['hapi-rate-limit'] = { skip: true };
      }
      return h.continue;
    });
  }

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
