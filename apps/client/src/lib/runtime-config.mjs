export function normalizeBaseUrl(baseUrl) {
  return (baseUrl || "http://localhost:3001").replace(/\/$/, "")
}

export function buildProtectedFileUrlFromParts(baseUrl, token, fileName) {
  if (!fileName) {
    return null
  }

  return `${normalizeBaseUrl(baseUrl)}/api/files/${encodeURIComponent(fileName)}?token=${encodeURIComponent(token || "dev-admin-token-change-me")}`
}
