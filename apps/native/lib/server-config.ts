import { getItemAsync, setItemAsync } from "expo-secure-store"

const STORAGE_KEY = "mindpocket_server_url"
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3000"

let _cached: string | null = null

export async function loadServerUrl(): Promise<string> {
  if (_cached) {
    return _cached
  }
  const stored = await getItemAsync(STORAGE_KEY)
  _cached = stored || DEFAULT_URL
  return _cached
}

export function getServerUrl(): string {
  return _cached || DEFAULT_URL
}

export async function saveServerUrl(url: string): Promise<void> {
  const normalized = normalizeUrl(url)
  _cached = normalized
  await setItemAsync(STORAGE_KEY, normalized)
}

function normalizeUrl(url: string): string {
  let normalized = url.trim()
  if (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1)
  }
  if (!/^https?:\/\//.test(normalized)) {
    normalized = `http://${normalized}`
  }
  return normalized
}
