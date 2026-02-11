import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "@/lib/auth-context"

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { authClient, serverUrl, switchServer } = useAuth()
  const { data: session } = authClient.useSession()
  const [server, setServer] = useState(serverUrl)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      router.replace("/(tabs)")
    }
  }, [session, router])

  const handleLogin = async () => {
    if (!(server.trim() && email.trim() && password.trim())) {
      Alert.alert("提示", "请输入服务器地址、邮箱和密码")
      return
    }

    setLoading(true)
    try {
      if (server.trim() !== serverUrl) {
        await switchServer(server.trim())
      }

      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      })

      if (error) {
        Alert.alert("登录失败", error.message || "请检查邮箱和密码")
        return
      }

      router.replace("/(tabs)")
    } catch (_e) {
      Alert.alert("登录失败", "网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>MindPocket</Text>
        <Text style={styles.subtitle}>登录以继续</Text>

        <Text style={styles.label}>服务器地址</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setServer}
          placeholder="https://your-server.com"
          style={styles.input}
          value={server}
        />

        <Text style={styles.label}>邮箱</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="your@email.com"
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>密码</Text>
        <TextInput
          autoComplete="password"
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          placeholder="输入密码"
          returnKeyType="done"
          secureTextEntry
          style={[styles.input, styles.inputPassword]}
          value={password}
        />

        <Pressable disabled={loading} onPress={handleLogin} style={styles.button}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>登录</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "700",
    color: "#262626",
  },
  subtitle: {
    marginBottom: 40,
    textAlign: "center",
    fontSize: 16,
    color: "#a3a3a3",
  },
  label: {
    marginBottom: 4,
    fontSize: 14,
    color: "#525252",
  },
  input: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputPassword: {
    marginBottom: 24,
  },
  button: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#171717",
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})
