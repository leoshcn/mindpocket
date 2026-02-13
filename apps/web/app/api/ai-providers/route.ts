import { headers } from "next/headers"
import { z } from "zod"
import { createProvider, getProvidersByUserId } from "@/db/queries/ai-provider"
import { auth } from "@/lib/auth"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["chat", "embedding"]),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  modelId: z.string().min(1),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const providers = await getProvidersByUserId(session.user.id)
  return Response.json(providers)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { id } = await createProvider({
    userId: session.user.id,
    ...parsed.data,
  })

  return Response.json({ id }, { status: 201 })
}
