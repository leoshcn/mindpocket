import { DefaultChatTransport } from "ai"
import { fetch as expoFetch } from "expo/fetch"
import { getItem } from "expo-secure-store"
import { getServerUrl } from "./server-config"

const IS_WEB = typeof document !== "undefined"

function getCookie(): string {
  const raw = getItem("mindpocket_cookie") || "{}"
  let parsed: Record<string, { value: string; expires: string | null }> = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    return ""
  }
  return Object.entries(parsed)
    .filter(([, v]) => !v.expires || new Date(v.expires) > new Date())
    .map(([key, v]) => `${key}=${v.value}`)
    .join("; ")
}

interface CreateChatTransportOptions {
  onUnauthorized?: () => void
}

export function createChatTransport(options?: CreateChatTransportOptions) {
  return new DefaultChatTransport({
    api: `${getServerUrl()}/api/chat`,
    fetch: (async (input, init) => {
      const response = await (expoFetch as unknown as typeof globalThis.fetch)(input, {
        credentials: "include",
        ...init,
      })
      if (response.status === 401) {
        options?.onUnauthorized?.()
      }
      return response
    }) as typeof globalThis.fetch,
    headers: () => {
      const headers: Record<string, string> = {}
      if (IS_WEB) {
        return headers
      }
      const cookie = getCookie()
      if (cookie) {
        headers.cookie = cookie
      }
      return headers
    },
  })
}
