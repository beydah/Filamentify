import express from "express"
import { requireAdmin } from "./auth.js"
import { config } from "./config.js"
import { handleError } from "./http.js"
import { inventoryRouter } from "./routes/inventory.js"
import { productsRouter } from "./routes/products.js"
import { systemRouter } from "./routes/system.js"
import { basicRateLimit, corsMiddleware, requestHardening } from "./security.js"

export function createApp() {
  const app = express()

  app.disable("x-powered-by")
  app.use(corsMiddleware())
  app.use(requestHardening)
  app.use(basicRateLimit)
  app.use(express.json({ limit: config.jsonBodyLimit }))
  app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }))

  app.use(systemRouter)
  app.use("/api", requireAdmin)
  app.use(inventoryRouter)
  app.use(productsRouter)

  app.use(handleError)
  return app
}
