import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // "parent" or "child"
  name: text("name").notNull(),
  profilePhoto: text("profile_photo"),
  points: integer("points").default(0),
  parentId: integer("parent_id"), // For child accounts, reference to parent user
  familyId: integer("family_id").notNull(), // Group users in families
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
  // New fields for timed chores
  duration: integer("duration"), // Duration in minutes
  isDurationChore: integer("is_duration_chore", { mode: "boolean" }).default(false),
  // Whether proof image is required for completion
  requiresProof: integer("requires_proof", { mode: "boolean" }).default(true),
});

export const rewards = sqliteTable("rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  points: integer("points").notNull(),
  imageUrl: text("image_url"),
  claimed: integer("claimed", { mode: "boolean" }).default(false),
  claimedBy: integer("claimed_by"),
  claimedAt: integer("claimed_at"),
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
  proofImageUrl: text("proof_image_url"), // Image URL for proof of completion
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  reviewedBy: integer("reviewed_by"), // Parent user ID who reviewed the completion
  reviewedAt: integer("reviewed_at"), // When the review happened
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
