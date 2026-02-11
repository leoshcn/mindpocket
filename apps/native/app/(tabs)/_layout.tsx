import { Ionicons } from "@expo/vector-icons"
import { Redirect, Tabs } from "expo-router"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { useAuth } from "@/lib/auth-context"

export default function TabLayout() {
  const { authClient } = useAuth()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#737373" size="small" />
      </View>
    )
  }

  if (!session?.user) {
    return <Redirect href="/login" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: "#e5e5e5",
          backgroundColor: "#fff",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "MindPocket",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="sparkles" size={size} />,
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: "知识库",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="library-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "笔记",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="document-text-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="person-outline" size={size} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
})
