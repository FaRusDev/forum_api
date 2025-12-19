require("dotenv").config()
const createServer = require("./Infrastructures/http/createServer")
const container = require("./Infrastructures/container")

;(async () => {
  try {
    const server = await createServer(container)
    await server.start()
    console.log(`server start at ${server.info.uri}`)

    // Handle uncaught errors
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err)
    })

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
})()
