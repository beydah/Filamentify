import assert from "node:assert/strict"
import { buildProtectedFileUrlFromParts, normalizeBaseUrl } from "../src/lib/runtime-config.mjs"

function runCase(name, callback) {
  callback()
  console.log(`ok - ${name}`)
}

runCase("normalizeBaseUrl trims a trailing slash", () => {
  assert.equal(normalizeBaseUrl("http://localhost:3001/"), "http://localhost:3001")
})

runCase("buildProtectedFileUrlFromParts returns a tokenized file URL", () => {
  assert.equal(
    buildProtectedFileUrlFromParts("http://localhost:3001/", "secret-token", "image.webp"),
    "http://localhost:3001/api/files/image.webp?token=secret-token",
  )
})
