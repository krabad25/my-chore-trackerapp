import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isParent: integer("is_parent", { mode: "boolean" }).default(false),
  childName: text("child_name"),
  profilePhoto: text("profile_photo"),
  points: integer("points").default(0),
  parentPin: text("parent_pin"),
});

export const chores = sqliteTable("chores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  points: integer("points").notNull(),
  imageUrl: text("image_url"),
  frequency: text("frequency").notNull(), // "daily" or "weekly"
  completed: integer("completed", { mode: "boolean" }).default(false),
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const rewards = sqliteTable("rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  points: integer("points").notNull(),
  imageUrl: text("image_url"),
  claimed: integer("claimed", { mode: "boolean" }).default(false),
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  icon: text("icon").notNull(),
  unlocked: integer("unlocked", { mode: "boolean" }).default(false),
  userId: integer("user_id").notNull(),
});

export const choreCompletions = sqliteTable("chore_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  choreId: integer("chore_id").notNull(),
  userId: integer("user_id").notNull(),
  completedAt: integer("completed_at").default(sql`(unixepoch())`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export const insertChoreCompletionSchema = createInsertSchema(choreCompletions).omit({
  id: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type ChoreCompletion = typeof choreCompletions.$inferSelect;
export type InsertChoreCompletion = z.infer<typeof insertChoreCompletionSchema>;
