import { buildProtectedFileUrlFromParts, normalizeBaseUrl } from "./runtime-config.mjs"

const DEFAULT_API_BASE_URL = "http://localhost:3001"
const DEFAULT_ADMIN_TOKEN = "dev-admin-token-change-me"

export const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL)
export const adminToken = import.meta.env.VITE_ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${adminToken}`)

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const errorMessage =
      typeof errorBody === "object" && errorBody && "error" in errorBody && typeof errorBody.error === "string"
        ? errorBody.error
        : `Request failed with status ${response.status}`

    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function apiJsonBody(payload: JsonValue) {
  return JSON.stringify(payload)
}

export function buildProtectedFileUrl(fileName?: string | null) {
  if (!fileName) {
    return null
  }

  return buildProtectedFileUrlFromParts(apiBaseUrl, adminToken, fileName)
}

export function installApiFetchShim() {
  if (typeof window === "undefined" || (window as Window & { __filamentifyFetchShimInstalled?: boolean }).__filamentifyFetchShimInstalled) {
    return
  }

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input instanceof Request
            ? input.url
            : String(input)

    const normalizedUrl = originalUrl.replace(DEFAULT_API_BASE_URL, apiBaseUrl)
    const request = input instanceof Request ? input : undefined
    const nextInit = { ...(request ? {} : init) }
    const headers = new Headers(request?.headers ?? init?.headers)

    if (normalizedUrl.startsWith(apiBaseUrl) || normalizedUrl.startsWith("/api/")) {
      headers.set("Authorization", `Bearer ${adminToken}`)
    }

    if (request) {
      return originalFetch(
        new Request(normalizedUrl, {
          method: request.method,
          headers,
          body: request.body,
          credentials: request.credentials,
          cache: request.cache,
          mode: request.mode,
          redirect: request.redirect,
          referrer: request.referrer,
          referrerPolicy: request.referrerPolicy,
          integrity: request.integrity,
          keepalive: request.keepalive,
          signal: request.signal,
        }),
      )
    }

    return originalFetch(normalizedUrl, {
      ...nextInit,
      headers,
    })
  }

  ;(window as Window & { __filamentifyFetchShimInstalled?: boolean }).__filamentifyFetchShimInstalled = true
}
