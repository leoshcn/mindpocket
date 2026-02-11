import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { HistoryDrawer } from "@/components/drawer/history-drawer"
import { SearchInput } from "@/components/home/search-input"
import { Toolbar } from "@/components/home/toolbar"
import { TrendingCard } from "@/components/home/trending-card"
import { ChatApiError, deleteChat, fetchHistory, type HistorySection } from "@/lib/chat-api"
import { getGreeting } from "@/lib/utils"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-v3.2")
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true)
  const [historySections, setHistorySections] = useState<HistorySection[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string>()
  const greeting = getGreeting()

  const handleSubmit = (text: string) => {
    if (!text.trim()) {
      return
    }
    const chatId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: chatId,
        initialMessage: text,
        selectedModel,
        useKnowledgeBase: String(useKnowledgeBase),
      },
    })
  }

  useEffect(() => {
    if (!drawerOpen) {
      return
    }

    let cancelled = false

    async function loadHistory() {
      setHistoryLoading(true)
      setHistoryError(undefined)

      try {
        const sections = await fetchHistory(20)
        if (cancelled) {
          return
        }
        setHistorySections(sections)
      } catch (error) {
        if (cancelled) {
          return
        }
        if (error instanceof ChatApiError && error.status === 401) {
          router.replace("/login")
          return
        }
        setHistoryError("历史记录加载失败，请稍后重试")
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [drawerOpen, router])

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId)
      setHistorySections((prev) =>
        prev
          .map((section) => ({
            ...section,
            data: section.data.filter((item) => item.id !== chatId),
          }))
          .filter((section) => section.data.length > 0)
      )
    } catch (error) {
      if (error instanceof ChatApiError && error.status === 401) {
        router.replace("/login")
        return
      }
      Alert.alert("删除失败", "请稍后重试")
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => setDrawerOpen(true)}>
          <Ionicons color="#333" name="menu-outline" size={24} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>{greeting}</Text>
          <Text style={styles.greetingSubtitle}>有什么可以帮您的吗？？</Text>
        </View>

        {/* Search Input */}
        <SearchInput onSubmit={handleSubmit} />

        {/* Toolbar */}
        <Toolbar
          onKnowledgeBaseChange={setUseKnowledgeBase}
          onModelChange={setSelectedModel}
          selectedModel={selectedModel}
          useKnowledgeBase={useKnowledgeBase}
        />

        {/* Trending Topics */}
        <TrendingCard />
      </ScrollView>

      {/* Drawer */}
      <HistoryDrawer
        error={historyError}
        loading={historyLoading}
        onClose={() => setDrawerOpen(false)}
        onDelete={handleDeleteChat}
        sections={historySections}
        visible={drawerOpen}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  greeting: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 64,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#262626",
  },
  greetingSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#a3a3a3",
  },
})
