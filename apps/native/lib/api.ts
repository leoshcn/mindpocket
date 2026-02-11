import { getAuthClient } from "./auth-client"
import { getServerUrl } from "./server-config"

export async function saveBookmark(url: string, title?: string) {
  const response = await getAuthClient().$fetch(`${getServerUrl()}/api/ingest`, {
    method: "POST",
    body: { url, title, clientSource: "mobile" },
  })
  return response.data
}
