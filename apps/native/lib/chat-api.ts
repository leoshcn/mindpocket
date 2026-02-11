import type { UIMessage } from "ai"
import { getItem } from "expo-secure-store"
import { getServerUrl } from "./server-config"

const IS_WEB = typeof document !== "undefined"

export class ChatApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ChatApiError"
  }
}

export interface HistoryChatItem {
  id: string
  title: string
  createdAt: string
}

export interface HistorySection {
  title: string
  data: HistoryChatItem[]
}

export interface ChatDetail {
  chat: {
    id: string
    title: string
    createdAt: string
  }
  messages: UIMessage[]
}

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

function createHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) }
  if (IS_WEB) {
    return headers
  }

  const cookie = getCookie()
  if (cookie) {
    headers.cookie = cookie
  }
  return headers
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getServerUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: createHeaders((init?.headers || undefined) as Record<string, string> | undefined),
  })

  if (!response.ok) {
    const message = (await response.text()) || "Request failed"
    throw new ChatApiError(response.status, message)
  }

  return (await response.json()) as T
}

async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`${getServerUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: createHeaders((init?.headers || undefined) as Record<string, string> | undefined),
  })

  if (!response.ok) {
    const message = (await response.text()) || "Request failed"
    throw new ChatApiError(response.status, message)
  }
}

function formatDateLabel(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(
    date.getDate()
  ).padStart(2, "0")}日`
}

export async function fetchHistory(limit = 20): Promise<HistorySection[]> {
  const data = await requestJson<{ chats: HistoryChatItem[] }>(`/api/history?limit=${limit}`)
  const grouped = new Map<string, HistoryChatItem[]>()
  for (const chat of data.chats) {
    const label = formatDateLabel(chat.createdAt)
    const prev = grouped.get(label)
    if (prev) {
      prev.push(chat)
      continue
    }
    grouped.set(label, [chat])
  }

  return Array.from(grouped.entries()).map(([title, items]) => ({
    title,
    data: items,
  }))
}

export async function fetchChatDetail(chatId: string): Promise<ChatDetail> {
  const data = await requestJson<{
    chat: { id: string; title: string; createdAt: string }
    messages: Array<{
      id: string
      role: "user" | "assistant"
      parts: UIMessage["parts"]
      createdAt: string
    }>
  }>(`/api/chat?id=${encodeURIComponent(chatId)}`)

  return {
    chat: data.chat,
    messages: data.messages.map((message) => ({
      ...message,
      createdAt: new Date(message.createdAt),
    })),
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  await requestVoid("/api/chat", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: chatId }),
  })
}
