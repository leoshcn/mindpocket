import { defineConfig } from "wxt"

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  dev: {
    server: {
      port: 3001,
    },
  },
  manifest: {
    name: "MindPocket",
    description: "Save web pages to MindPocket",
    permissions: ["activeTab", "storage", "notifications"],
    host_permissions: ["<all_urls>"],
  },
})
