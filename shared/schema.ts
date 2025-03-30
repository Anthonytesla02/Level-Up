import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  xpass: integer("xpass").notNull().default(0),
  title: text("title").notNull().default("Novice Challenger"),
  streak: integer("streak").notNull().default(0),
  lastLoginDate: timestamp("last_login_date").notNull().defaultNow(),
  lastTaskGenerationDate: timestamp("last_task_generation_date"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tasks/Quests table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  xpReward: integer("xp_reward").notNull(),
  createdBy: text("created_by").notNull(), // "user" or "ai"
  proofType: text("proof_type").notNull(), // "photo" or "text"
  status: text("status").notNull().default("active"), // "active", "completed", "failed"
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  proof: text("proof"), // URL or text proof
  category: text("category"),
  aiRecommendation: text("ai_recommendation"),
  failurePenalty: json("failure_penalty").$type<{ type: "credits" | "xp", amount: number }>(),
  isSpecialChallenge: boolean("is_special_challenge").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Punishment options table
export const punishmentOptions = pgTable("punishment_options", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  type: text("type").notNull(), // "xp", "xpass", "physical"
  value: text("value").notNull(), // amount of XP/XPass or description of physical
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  xpReward: integer("xp_reward").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginDate: true,
  lastTaskGenerationDate: true,
  isLocked: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  proof: true,
  status: true,
  // Note: Don't omit isSpecialChallenge as we need it for the API generated tasks
});

export const insertPunishmentOptionSchema = createInsertSchema(punishmentOptions).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register schema
export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Complete task schema
export const completeTaskSchema = z.object({
  taskId: z.number(),
  proof: z.string(),
});

// Select punishment schema
export const selectPunishmentSchema = z.object({
  taskId: z.number(),
  punishmentId: z.number(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type PunishmentOption = typeof punishmentOptions.$inferSelect;
export type InsertPunishmentOption = z.infer<typeof insertPunishmentOptionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type CompleteTask = z.infer<typeof completeTaskSchema>;
export type SelectPunishment = z.infer<typeof selectPunishmentSchema>;
