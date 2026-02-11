import { expoClient } from "@better-auth/expo/client"
import { createAuthClient } from "better-auth/react"
import { getItem, setItem } from "expo-secure-store"
import { getServerUrl } from "./server-config"

function buildAuthClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [
      expoClient({
        scheme: "mindpocket",
        storagePrefix: "mindpocket",
        storage: { getItem, setItem },
      }),
    ],
  })
}

export type AuthClient = ReturnType<typeof buildAuthClient>

let _client = buildAuthClient(getServerUrl())
let _currentUrl = getServerUrl()

export function getAuthClient(): AuthClient {
  return _client
}

export function resetAuthClient(serverUrl: string): AuthClient {
  if (serverUrl === _currentUrl) {
    return _client
  }
  _currentUrl = serverUrl
  _client = buildAuthClient(serverUrl)
  return _client
}
