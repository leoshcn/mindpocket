import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function NotesScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Ionicons color="#999" name="download-outline" size={48} />
      <Text style={styles.title}>导入</Text>
      <Text style={styles.subtitle}>即将推出</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#a3a3a3",
  },
})
