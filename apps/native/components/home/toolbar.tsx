import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { chatModels } from "@/lib/mock-data"
import { ModelPicker } from "./model-picker"

interface ToolbarProps {
  selectedModel: string
  onModelChange: (model: string) => void
  useKnowledgeBase: boolean
  onKnowledgeBaseChange: (value: boolean) => void
}

export function Toolbar({
  selectedModel,
  onModelChange,
  useKnowledgeBase,
  onKnowledgeBaseChange,
}: ToolbarProps) {
  const [pickerVisible, setPickerVisible] = useState(false)
  const currentModel = chatModels.find((m) => m.id === selectedModel)

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <ToolbarChip
          icon="globe-outline"
          label={currentModel?.name ?? "GPT-4o Mini"}
          onPress={() => setPickerVisible(true)}
        />
        <ToolbarToggleChip
          active={useKnowledgeBase}
          icon="book-outline"
          label="知识库"
          onPress={() => onKnowledgeBaseChange(!useKnowledgeBase)}
        />
        <ToolbarIconButton icon="at" />
        <ToolbarIconButton icon="add" />
      </ScrollView>
      <ModelPicker
        onClose={() => setPickerVisible(false)}
        onSelect={onModelChange}
        selectedModel={selectedModel}
        visible={pickerVisible}
      />
    </View>
  )
}

function ToolbarChip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress?: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Ionicons color="#666" name={icon} size={16} />
      <Text style={styles.chipText}>{label}</Text>
      <Ionicons color="#999" name="chevron-down" size={12} />
    </Pressable>
  )
}

function ToolbarToggleChip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Ionicons color={active ? "#2563eb" : "#666"} name={icon} size={16} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

function ToolbarIconButton({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable style={styles.iconButton}>
      <Ionicons color="#666" name={icon} size={18} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scrollContent: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
  },
  chipText: {
    fontSize: 14,
    color: "#525252",
  },
  chipTextActive: {
    color: "#2563eb",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
})
