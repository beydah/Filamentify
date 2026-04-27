import cors from "cors"
import fs from "fs"
import multer from "multer"
import path from "path"
import { randomUUID } from "crypto"
import type { RequestHandler } from "express"
import type { FileFilterCallback } from "multer"
import { config } from "./config.js"
import { ApiError, assert, fail } from "./http.js"

export function ensureStorage() {
  fs.mkdirSync(config.dataDir, { recursive: true })
  fs.mkdirSync(config.uploadsDir, { recursive: true })
}

export function corsMiddleware() {
  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }

      if (config.clientOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new ApiError(403, `Origin ${origin} is not allowed`, "cors_denied"))
    },
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Token"],
  })
}

export const requestHardening: RequestHandler = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("Referrer-Policy", "no-referrer")
  res.setHeader("Cross-Origin-Resource-Policy", "same-site")
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }

  next()
}

const requestsPerMinute = new Map<string, { count: number; windowStart: number }>()

export const basicRateLimit: RequestHandler = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown"
  const currentTime = Date.now()
  const current = requestsPerMinute.get(key)

  if (!current || currentTime - current.windowStart >= 60_000) {
    requestsPerMinute.set(key, { count: 1, windowStart: currentTime })
    next()
    return
  }

  current.count += 1
  if (current.count > 240) {
    next(new ApiError(429, "Too many requests", "rate_limited"))
    return
  }

  next()
}

const memoryStorage = multer.memoryStorage()

function fileFilter(req: Express.Request, file: Express.Multer.File, callback: FileFilterCallback) {
  void req
  callback(null, true)
}

export const uploadSingle = multer({
  storage: memoryStorage,
  limits: { fileSize: config.uploadMaxBytes },
  fileFilter,
}).single("file")

export const uploadProductImages = multer({
  storage: memoryStorage,
  limits: { fileSize: config.uploadMaxBytes },
  fileFilter,
}).fields([
  { name: "imageFront", maxCount: 1 },
  { name: "imageBack", maxCount: 1 },
])

type UploadKind = "image" | "model"

function hasPngSignature(buffer: Buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
}

function hasJpegSignature(buffer: Buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
}

function hasWebpSignature(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
}

function hasStlSignature(buffer: Buffer) {
  const asciiHeader = buffer.subarray(0, 5).toString("ascii").toLowerCase()
  return asciiHeader === "solid" || buffer.length >= 84
}

function validateFile(file: Express.Multer.File, kind: UploadKind): string {
  const extension = path.extname(file.originalname).toLowerCase()
  const imageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"])
  const modelMimeTypes = new Set(["model/stl", "application/sla", "application/octet-stream", "application/vnd.ms-pki.stl"])

  if (kind === "image") {
    assert([".png", ".jpg", ".jpeg", ".webp"].includes(extension), 400, "Unsupported image extension", "upload_error")
    assert(imageMimeTypes.has(file.mimetype), 400, "Unsupported image MIME type", "upload_error")

    const validSignature =
      (extension === ".png" && hasPngSignature(file.buffer)) ||
      ([".jpg", ".jpeg"].includes(extension) && hasJpegSignature(file.buffer)) ||
      (extension === ".webp" && hasWebpSignature(file.buffer))

    assert(validSignature, 400, "Image signature does not match file extension", "upload_error")
    return extension
  }

  assert(extension === ".stl", 400, "Only STL model uploads are allowed", "upload_error")
  assert(modelMimeTypes.has(file.mimetype), 400, "Unsupported model MIME type", "upload_error")
  assert(hasStlSignature(file.buffer), 400, "Model signature does not match STL format", "upload_error")
  return extension
}

export function getUploadedFile(
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
  fieldName: string,
): Express.Multer.File | null {
  if (!files) {
    return null
  }

  if (Array.isArray(files)) {
    return files[0] ?? null
  }

  return files[fieldName]?.[0] ?? null
}

export async function persistUpload(file: Express.Multer.File | undefined | null, kind: UploadKind): Promise<string | null> {
  if (!file) {
    return null
  }

  const extension = validateFile(file, kind)
  const fileName = `${kind}-${Date.now()}-${randomUUID()}${extension}`
  const targetPath = path.join(config.uploadsDir, fileName)

  await fs.promises.writeFile(targetPath, file.buffer)
  return fileName
}

export async function removeUpload(fileName: string | null | undefined) {
  if (!fileName) {
    return
  }

  const safeName = path.basename(fileName)
  const targetPath = path.join(config.uploadsDir, safeName)
  try {
    await fs.promises.unlink(targetPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error
    }
  }
}

export function resolveUploadPath(fileName: string): string {
  const safeName = path.basename(fileName)
  const resolved = path.join(config.uploadsDir, safeName)
  if (!resolved.startsWith(config.uploadsDir)) {
    fail(400, "Invalid file path", "upload_error")
  }

  return resolved
}
