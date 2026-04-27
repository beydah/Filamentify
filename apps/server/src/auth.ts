import type { NextFunction, Request, Response } from "express"
import { config } from "./config.js"
import { ApiError } from "./http.js"

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim()
  }

  const headerToken = req.headers["x-admin-token"]
  if (typeof headerToken === "string" && headerToken.trim()) {
    return headerToken.trim()
  }

  const queryToken = req.query.token
  if (typeof queryToken === "string" && queryToken.trim()) {
    return queryToken.trim()
  }

  return null
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  void res
  const token = extractToken(req)
  if (!token || token !== config.adminToken) {
    next(new ApiError(401, "Admin token is missing or invalid", "unauthorized"))
    return
  }

  next()
}
