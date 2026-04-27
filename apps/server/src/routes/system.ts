import fs from "fs"
import { Router } from "express"
import { requireAdmin } from "../auth.js"
import { config } from "../config.js"
import { asyncHandler, notFound } from "../http.js"
import { resolveUploadPath } from "../security.js"

const systemRouter = Router()

systemRouter.get("/", (req, res) => {
  void req
  res.json({
    message: "Welcome to the Filamentify API",
    docs: "/api/ping",
  })
})

systemRouter.get("/api/ping", (req, res) => {
  void req
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    dataDir: config.dataDir,
  })
})

systemRouter.get(
  "/api/files/:fileName",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const requestedFile = Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName
    const filePath = resolveUploadPath(requestedFile)
    if (!fs.existsSync(filePath)) {
      notFound("File was not found")
    }

    res.sendFile(filePath)
  }),
)

export { systemRouter }
