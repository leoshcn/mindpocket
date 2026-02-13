import { relations } from "drizzle-orm"
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { user } from "./auth"

export const userAiProvider = pgTable(
  "user_ai_provider",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // "chat" | "embedding"
    baseUrl: text("base_url").notNull(),
    apiKey: text("api_key").notNull(), // AES-256-GCM encrypted
    modelId: text("model_id").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("user_ai_provider_userId_idx").on(table.userId)]
)

export const userAiProviderRelations = relations(userAiProvider, ({ one }) => ({
  user: one(user, {
    fields: [userAiProvider.userId],
    references: [user.id],
  }),
}))
