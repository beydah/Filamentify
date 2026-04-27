import type { NextFunction, Request, Response } from "express"
import multer from "multer"

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, message: string, code = "bad_request", details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function fail(status: number, message: string, code = "bad_request", details?: unknown): never {
  throw new ApiError(status, message, code, details)
}

export function assert(condition: unknown, status: number, message: string, code = "bad_request"): asserts condition {
  if (!condition) {
    fail(status, message, code)
  }
}

export function parseId(value: unknown, field = "id"): number {
  const id = Number(value)
  assert(Number.isInteger(id) && id > 0, 400, `${field} must be a positive integer`, "validation_error")
  return id
}

export function parseOptionalId(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") {
    return null
  }

  return parseId(value, field)
}

export function parseNumberField(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; integer?: boolean } = {},
): number {
  const numeric = Number(value)
  const validNumber = options.integer ? Number.isInteger(numeric) : Number.isFinite(numeric)
  assert(validNumber, 400, `${field} must be a valid number`, "validation_error")

  if (options.min !== undefined) {
    assert(numeric >= options.min, 400, `${field} must be at least ${options.min}`, "validation_error")
  }

  if (options.max !== undefined) {
    assert(numeric <= options.max, 400, `${field} must be at most ${options.max}`, "validation_error")
  }

  return numeric
}

export function parseStringField(value: unknown, field: string, { required = true, maxLength = 255 }: { required?: boolean; maxLength?: number } = {}): string {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) {
    if (required) {
      fail(400, `${field} is required`, "validation_error")
    }
    return ""
  }

  assert(text.length <= maxLength, 400, `${field} is too long`, "validation_error")
  return text
}

export function parseOptionalString(value: unknown, field: string, maxLength = 2048): string | null {
  if (value === undefined || value === null || value === "") {
    return null
  }

  return parseStringField(value, field, { required: false, maxLength })
}

export function parseIsoDate(value: unknown, field: string): string {
  const text = parseStringField(value, field)
  const timestamp = Date.parse(text)
  assert(!Number.isNaN(timestamp), 400, `${field} must be a valid ISO date`, "validation_error")
  return new Date(timestamp).toISOString()
}

export function asyncHandler<TRequest extends Request = Request>(
  handler: (req: TRequest, res: Response, next: NextFunction) => Promise<void> | void,
) {
  return (req: TRequest, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export function sendCreated(res: Response, data: unknown) {
  res.status(201).json(data)
}

export function notFound(message: string): never {
  fail(404, message, "not_found")
}

export function handleError(error: unknown, req: Request, res: Response, next: NextFunction) {
  void req
  void next

  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: error.message,
      code: error.code,
      details: error.details,
    })
    return
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Uploaded file is too large" : error.message
    res.status(400).json({
      error: message,
      code: "upload_error",
    })
    return
  }

  const sqliteCode = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined
  if (typeof sqliteCode === "string" && sqliteCode.startsWith("SQLITE_CONSTRAINT_FOREIGNKEY")) {
    res.status(409).json({
      error: "Related record was not found or is no longer valid",
      code: "foreign_key_conflict",
    })
    return
  }

  console.error(error)

  res.status(500).json({
    error: "Internal server error",
    code: "internal_error",
  })
}
