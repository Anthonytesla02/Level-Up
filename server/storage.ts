import { 
  User, InsertUser, 
  Task, InsertTask, 
  PunishmentOption, InsertPunishmentOption,
  Achievement, InsertAchievement,
  users, tasks, punishmentOptions, achievements
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Interface defining all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  getActiveTasksByUserId(userId: number): Promise<Task[]>;
  getCompletedTasksByUserId(userId: number): Promise<Task[]>;
  getFailedTasksByUserId(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  getExpiredTasks(): Promise<Task[]>;
  
  // Punishment operations
  getPunishmentsByTaskId(taskId: number): Promise<PunishmentOption[]>;
  createPunishment(punishment: InsertPunishmentOption): Promise<PunishmentOption>;
  
  // Achievement operations
  getAchievementsByUserId(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

// Database implementation of storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'user_sessions', // Change the table name to avoid SQL keyword issues
      createTableIfMissing: true
    });
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        level: 1,
        xp: 0,
        xpass: 100, // Give users some initial XPass
        title: "Novice Challenger",
        streak: 0,
        isLocked: false
      })
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getActiveTasksByUserId(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "active")));
  }

  async getCompletedTasksByUserId(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "completed")));
  }

  async getFailedTasksByUserId(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "failed")));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({
        ...insertTask,
        status: "active",
        proof: null,
        completedAt: null
      })
      .returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async getExpiredTasks(): Promise<Task[]> {
    const now = new Date();
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, "active"), lt(tasks.expiresAt, now)));
  }

  // Punishment operations
  async getPunishmentsByTaskId(taskId: number): Promise<PunishmentOption[]> {
    return await db
      .select()
      .from(punishmentOptions)
      .where(eq(punishmentOptions.taskId, taskId));
  }

  async createPunishment(insertPunishment: InsertPunishmentOption): Promise<PunishmentOption> {
    const [punishment] = await db
      .insert(punishmentOptions)
      .values(insertPunishment)
      .returning();
    return punishment;
  }

  // Achievement operations
  async getAchievementsByUserId(userId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
    return achievement;
  }
}

// In-memory implementation of storage interface - kept for reference
class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private punishments: Map<number, PunishmentOption>;
  private achievements: Map<number, Achievement>;
  
  private userIdCounter: number;
  private taskIdCounter: number;
  private punishmentIdCounter: number;
  private achievementIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.punishments = new Map();
    this.achievements = new Map();
    
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    this.punishmentIdCounter = 1;
    this.achievementIdCounter = 1;
    
    // Setup in-memory session store
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      level: 1,
      xp: 0,
      xpass: 100, // Give users some initial XPass
      title: "Novice Challenger",
      streak: 0,
      lastLoginDate: now,
      lastTaskGenerationDate: null, // Initialize with null
      isLocked: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }

  async getActiveTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && task.status === "active"
    );
  }

  async getCompletedTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && task.status === "completed"
    );
  }

  async getFailedTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && task.status === "failed"
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      status: "active",
      proof: null,
      completedAt: null,
      createdAt: now,
      category: insertTask.category || null,
      aiRecommendation: insertTask.aiRecommendation || null,
      isSpecialChallenge: insertTask.isSpecialChallenge ?? false
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getExpiredTasks(): Promise<Task[]> {
    const now = new Date();
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === "active" && new Date(task.expiresAt) < now
    );
  }

  // Punishment operations
  async getPunishmentsByTaskId(taskId: number): Promise<PunishmentOption[]> {
    return Array.from(this.punishments.values()).filter(
      (punishment) => punishment.taskId === taskId
    );
  }

  async createPunishment(insertPunishment: InsertPunishmentOption): Promise<PunishmentOption> {
    const id = this.punishmentIdCounter++;
    const now = new Date();
    const punishment: PunishmentOption = {
      ...insertPunishment,
      id,
      createdAt: now
    };
    this.punishments.set(id, punishment);
    return punishment;
  }

  // Achievement operations
  async getAchievementsByUserId(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(
      (achievement) => achievement.userId === userId
    );
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementIdCounter++;
    const now = new Date();
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      createdAt: now,
      unlockedAt: insertAchievement.unlockedAt || now
    };
    this.achievements.set(id, achievement);
    return achievement;
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
