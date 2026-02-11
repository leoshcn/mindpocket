import { deleteItemAsync } from "expo-secure-store"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { type AuthClient, getAuthClient, resetAuthClient } from "./auth-client"
import { getServerUrl, loadServerUrl, saveServerUrl } from "./server-config"

interface AuthContextValue {
  authClient: AuthClient
  serverUrl: string
  switchServer: (url: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [serverUrl, setUrl] = useState(() => getServerUrl())
  const [authClient, setAuthClient] = useState(() => getAuthClient())

  useEffect(() => {
    loadServerUrl().then((url) => {
      const client = resetAuthClient(url)
      setUrl(url)
      setAuthClient(() => client)
      setReady(true)
    })
  }, [])

  const switchServer = useCallback(async (url: string) => {
    await saveServerUrl(url)
    await deleteItemAsync("mindpocket_cookie").catch(() => {})
    const newClient = resetAuthClient(url)
    setUrl(url)
    setAuthClient(() => newClient)
  }, [])

  const value = useMemo(
    () => ({ authClient, serverUrl, switchServer }),
    [authClient, serverUrl, switchServer]
  )

  if (!ready) {
    return null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
