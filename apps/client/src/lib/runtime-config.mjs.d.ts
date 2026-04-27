declare module "./runtime-config.mjs" {
  export function normalizeBaseUrl(baseUrl?: string): string
  export function buildProtectedFileUrlFromParts(
    baseUrl: string | undefined,
    token: string | undefined,
    fileName: string | null | undefined,
  ): string | null
}
