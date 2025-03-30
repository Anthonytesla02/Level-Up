import { 
  User, InsertUser, 
  Task, InsertTask, 
  PunishmentOption, InsertPunishmentOption,
  Achievement, InsertAchievement
} from "@shared/schema";

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
}

// In-memory implementation of storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private punishments: Map<number, PunishmentOption>;
  private achievements: Map<number, Achievement>;
  
  private userIdCounter: number;
  private taskIdCounter: number;
  private punishmentIdCounter: number;
  private achievementIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.punishments = new Map();
    this.achievements = new Map();
    
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    this.punishmentIdCounter = 1;
    this.achievementIdCounter = 1;
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
      createdAt: now
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
      createdAt: now
    };
    this.achievements.set(id, achievement);
    return achievement;
  }
}

export const storage = new MemStorage();
