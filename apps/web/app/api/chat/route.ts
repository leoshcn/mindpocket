import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai"
import { headers } from "next/headers"
import { after } from "next/server"
import { createResumableStreamContext } from "resumable-stream"
import { z } from "zod"
import { getDefaultProvider, getProviderWithDecryptedKey } from "@/db/queries/ai-provider"
import {
  clearActiveStreamId,
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitle,
} from "@/db/queries/chat"
import { findRelevantContent } from "@/lib/ai/embedding"
import { generateTitleFromUserMessage, systemPrompt } from "@/lib/ai/prompts"
import { getChatModel } from "@/lib/ai/provider"
import { auth } from "@/lib/auth"
import { corsPreflight, withCors } from "@/lib/cors"

export const maxDuration = 60

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after })
  } catch {
    return null
  }
}

export function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return withCors(req, new Response("Unauthorized", { status: 401 }))
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return withCors(req, new Response("Missing id", { status: 400 }))
  }

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== session.user.id) {
    return withCors(req, new Response("Not found", { status: 404 }))
  }

  const dbMessages = await getMessagesByChatId({ id })

  return withCors(
    req,
    Response.json({
      chat: {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt.toISOString(),
      },
      messages: dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
        createdAt: msg.createdAt.toISOString(),
      })),
    })
  )
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return withCors(req, new Response("Unauthorized", { status: 401 }))
  }

  const {
    id,
    messages,
    selectedChatModel,
    useKnowledgeBase = true,
  }: {
    id: string
    messages: UIMessage[]
    selectedChatModel?: string
    useKnowledgeBase?: boolean
  } = await req.json()

  const userId = session.user.id

  // Resolve chat model config
  let config: Awaited<ReturnType<typeof getProviderWithDecryptedKey>> = null
  if (selectedChatModel) {
    config = await getProviderWithDecryptedKey(selectedChatModel, userId)
  }
  if (!config) {
    config = await getDefaultProvider(userId, "chat")
  }
  if (!config) {
    return withCors(req, Response.json({ error: "no_chat_model" }, { status: 400 }))
  }

  const userMessage = messages.at(-1)
  if (!userMessage || userMessage.role !== "user") {
    return withCors(req, new Response("Invalid message", { status: 400 }))
  }

  const existingChat = await getChatById({ id })
  const isNewChat = !existingChat

  if (isNewChat) {
    await saveChat({ id, userId, title: "新对话" })
  }

  await saveMessages({
    messages: [
      {
        id: userMessage.id,
        chatId: id,
        role: userMessage.role,
        parts: userMessage.parts,
        createdAt: new Date(),
      },
    ],
  })

  const model = getChatModel(config)

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model,
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: useKnowledgeBase
          ? {
              getInformation: tool({
                description:
                  "从用户的书签知识库中检索相关信息来回答问题。当用户提问时，优先使用此工具搜索知识库。",
                inputSchema: z.object({
                  question: z.string().describe("用于搜索知识库的查询语句"),
                }),
                execute: async ({ question }) => findRelevantContent(userId, question),
              }),
            }
          : undefined,
        stopWhen: stepCountIs(useKnowledgeBase ? 3 : 1),
        onFinish: async ({ response }) => {
          const assistantMessages = response.messages.filter((m) => m.role === "assistant")
          if (assistantMessages.length > 0) {
            const lastMsg = assistantMessages.at(-1)!
            await saveMessages({
              messages: [
                {
                  id: generateId(),
                  chatId: id,
                  role: "assistant",
                  parts: lastMsg.content,
                  createdAt: new Date(),
                },
              ],
            })
          }

          await clearActiveStreamId({ chatId: id })
        },
      })

      result.consumeStream()

      writer.merge(result.toUIMessageStream({ sendReasoning: true }))

      if (isNewChat) {
        const textPart = userMessage.parts.find((p) => p.type === "text")
        if (textPart && "text" in textPart) {
          generateTitleFromUserMessage({ message: textPart.text, model }).then(async (title) => {
            await updateChatTitle({ chatId: id, title })
          })
        }
      }
    },
  })

  return withCors(
    req,
    createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return
        }
        try {
          const streamContext = getStreamContext()
          if (streamContext) {
            const streamId = generateId()
            await createStreamId({ streamId, chatId: id })
            await streamContext.createNewResumableStream(streamId, () => sseStream)
          }
        } catch {
          // ignore redis errors
        }
      },
    })
  )
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return withCors(req, new Response("Unauthorized", { status: 401 }))
  }

  const { id }: { id: string } = await req.json()

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== session.user.id) {
    return withCors(req, new Response("Not found", { status: 404 }))
  }

  await deleteChatById({ id })
  return withCors(req, new Response("OK", { status: 200 }))
}
