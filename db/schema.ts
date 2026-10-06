import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
export const learningState = sqliteTable("learning_state", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  revision: integer("revision").notNull().default(0),
});
export const learningEvents = sqliteTable("learning_events", {
  userId: text("user_id").notNull(),
  eventId: text("event_id").notNull(),
  createdAt: text("created_at").notNull(),
}, table=>[primaryKey({columns:[table.userId,table.eventId]})]);
