import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "../../..")

const DEFAULT_ADMIN_TOKEN = "dev-admin-token-change-me"

function parsePort(value: string | undefined): number {
  const port = Number(value ?? "3001")
  return Number.isInteger(port) && port > 0 ? port : 3001
}

function parseOrigins(value: string | undefined): string[] {
  const origins = (value ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins.length > 0 ? origins : ["http://localhost:5173", "http://127.0.0.1:5173"]
}

const dataDir = path.resolve(repoRoot, process.env.DATA_DIR ?? "data")
const uploadsDir = path.resolve(dataDir, process.env.UPLOADS_DIR ?? "uploads")
const adminToken = process.env.ADMIN_TOKEN?.trim() || DEFAULT_ADMIN_TOKEN

if (process.env.NODE_ENV === "production" && adminToken === DEFAULT_ADMIN_TOKEN) {
  throw new Error("ADMIN_TOKEN must be set to a non-default value in production")
}

export const config = {
  repoRoot,
  port: parsePort(process.env.PORT),
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  adminToken,
  dataDir,
  uploadsDir,
  databasePath: path.resolve(dataDir, "filamentify.sqlite"),
  jsonBodyLimit: "1mb",
  uploadMaxBytes: 20 * 1024 * 1024,
}

export const defaults = {
  adminToken: DEFAULT_ADMIN_TOKEN,
}
