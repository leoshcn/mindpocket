import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ChatInputBar } from "@/components/chat/chat-input-bar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { createChatTransport } from "@/lib/chat"
import { ChatApiError, fetchChatDetail } from "@/lib/chat-api"

function ChatSession({
  id,
  initialMessages,
  initialMessage,
  selectedModel,
  useKnowledgeBase,
}: {
  id: string
  initialMessages: UIMessage[]
  initialMessage?: string
  selectedModel?: string
  useKnowledgeBase?: boolean
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [inputText, setInputText] = useState("")
  const hasSentInitial = useRef(false)

  const { messages, status, error, sendMessage, stop } = useChat({
    id,
    messages: initialMessages,
    transport: createChatTransport({
      onUnauthorized: () => {
        router.replace("/login")
      },
    }),
    experimental_throttle: 50,
    chatRequestBody: {
      selectedChatModel: selectedModel || "deepseek/deepseek-v3.2",
      useKnowledgeBase: useKnowledgeBase ?? true,
    },
    onError: (err) => {
      Alert.alert("发送失败", err.message || "请稍后重试")
    },
  })

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current && initialMessages.length === 0) {
      hasSentInitial.current = true
      sendMessage({ text: initialMessage })
    }
  }, [initialMessage, sendMessage, initialMessages.length])

  const isStreaming = status === "streaming" || status === "submitted"

  const handleSend = () => {
    if (!inputText.trim()) {
      return
    }
    sendMessage({ text: inputText.trim() })
    setInputText("")
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
      style={styles.container}
    >
      <ChatMessages error={error} messages={messages} status={status} />
      <View style={{ paddingBottom: insets.bottom }}>
        <ChatInputBar
          isStreaming={isStreaming}
          onChangeText={setInputText}
          onSend={handleSend}
          onStop={stop}
          value={inputText}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

export default function ChatScreen() {
  const router = useRouter()
  const { id, initialMessage, selectedModel, useKnowledgeBase } = useLocalSearchParams<{
    id: string
    initialMessage?: string
    selectedModel?: string
    useKnowledgeBase?: string
  }>()
  const [loadingInitialMessages, setLoadingInitialMessages] = useState(true)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])

  useEffect(() => {
    let cancelled = false
    const handleLoadError = (error: unknown) => {
      if (cancelled) {
        return
      }

      if (error instanceof ChatApiError && error.status === 401) {
        router.replace("/login")
        return
      }

      if (error instanceof ChatApiError && error.status === 404) {
        Alert.alert("对话不存在", "该对话已被删除或无权限访问", [
          { text: "确定", onPress: () => router.replace("/(tabs)") },
        ])
        return
      }

      Alert.alert("加载失败", "无法获取历史消息，请稍后重试", [
        { text: "返回", onPress: () => router.replace("/(tabs)") },
      ])
    }

    async function loadMessages() {
      if (!id) {
        setLoadingInitialMessages(false)
        return
      }

      if (initialMessage) {
        setInitialMessages([])
        setLoadingInitialMessages(false)
        return
      }

      try {
        const detail = await fetchChatDetail(id)
        if (!cancelled) {
          setInitialMessages(detail.messages)
        }
      } catch (error) {
        handleLoadError(error)
      } finally {
        if (!cancelled) {
          setLoadingInitialMessages(false)
        }
      }
    }

    loadMessages()

    return () => {
      cancelled = true
    }
  }, [id, initialMessage, router])

  if (loadingInitialMessages) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#737373" size="small" />
      </View>
    )
  }

  if (!id) {
    return null
  }

  return (
    <ChatSession
      id={id}
      initialMessage={initialMessage}
      initialMessages={initialMessages}
      selectedModel={selectedModel}
      useKnowledgeBase={useKnowledgeBase !== "false"}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
})
