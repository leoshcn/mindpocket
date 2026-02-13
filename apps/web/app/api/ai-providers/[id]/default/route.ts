import { headers } from "next/headers"
import {
  clearDefaultProvider,
  getProviderWithDecryptedKey,
  updateProvider,
} from "@/db/queries/ai-provider"
import { auth } from "@/lib/auth"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const provider = await getProviderWithDecryptedKey(id, session.user.id)
  if (!provider) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await clearDefaultProvider(session.user.id, provider.type)
  await updateProvider(id, session.user.id, { isDefault: true })

  return Response.json({ ok: true })
}
