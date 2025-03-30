import Airtable from "airtable";
import { User, Task, Achievement } from "@shared/schema";

// Initialize Airtable
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY || "default_key",
}).base(process.env.AIRTABLE_BASE_ID || "default_base");

// Tables
const USERS_TABLE = "Users";
const TASKS_TABLE = "Tasks";
const ACHIEVEMENTS_TABLE = "Achievements";

// Type for partial user updates
type UserUpdate = Partial<Omit<User, "password">>;

class AirtableService {
  // User operations
  async createUser(user: Omit<User, "password" | "createdAt" | "lastLoginDate">): Promise<void> {
    try {
      await airtable(USERS_TABLE).create([
        {
          fields: {
            id: user.id,
            username: user.username,
            display_name: user.displayName,
            email: user.email,
            level: user.level,
            xp: user.xp,
            xpass: user.xpass,
            title: user.title,
            streak: user.streak,
            is_locked: false,
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating user in Airtable:", error);
    }
  }

  async updateUser(userId: number, data: UserUpdate): Promise<void> {
    try {
      // First find the record in Airtable by user ID
      const records = await airtable(USERS_TABLE)
        .select({
          filterByFormula: `{id} = ${userId}`,
        })
        .firstPage();

      if (!records || records.length === 0) {
        console.error(`User with ID ${userId} not found in Airtable`);
        return;
      }

      // Prepare fields to update
      const fields: Record<string, any> = {};
      
      if (data.displayName !== undefined) fields.display_name = data.displayName;
      if (data.email !== undefined) fields.email = data.email;
      if (data.level !== undefined) fields.level = data.level;
      if (data.xp !== undefined) fields.xp = data.xp;
      if (data.xpass !== undefined) fields.xpass = data.xpass;
      if (data.title !== undefined) fields.title = data.title;
      if (data.streak !== undefined) fields.streak = data.streak;
      if (data.isLocked !== undefined) fields.is_locked = data.isLocked;

      // Update the record
      await airtable(USERS_TABLE).update([
        {
          id: records[0].id,
          fields,
        },
      ]);
    } catch (error) {
      console.error("Error updating user in Airtable:", error);
    }
  }

  // Task operations
  async createTask(task: Task): Promise<void> {
    try {
      await airtable(TASKS_TABLE).create([
        {
          fields: {
            id: task.id,
            user_id: task.userId,
            title: task.title,
            description: task.description,
            difficulty: task.difficulty,
            xp_reward: task.xpReward,
            created_by: task.createdBy,
            proof_type: task.proofType,
            status: task.status,
            expires_at: task.expiresAt,
            category: task.category || "",
            ai_recommendation: task.aiRecommendation || "",
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating task in Airtable:", error);
    }
  }

  async updateTask(taskId: number, data: Partial<Task>): Promise<void> {
    try {
      // First find the record in Airtable by task ID
      const records = await airtable(TASKS_TABLE)
        .select({
          filterByFormula: `{id} = ${taskId}`,
        })
        .firstPage();

      if (!records || records.length === 0) {
        console.error(`Task with ID ${taskId} not found in Airtable`);
        return;
      }

      // Prepare fields to update
      const fields: Record<string, any> = {};
      
      if (data.title !== undefined) fields.title = data.title;
      if (data.description !== undefined) fields.description = data.description;
      if (data.status !== undefined) fields.status = data.status;
      if (data.completedAt !== undefined) fields.completed_at = data.completedAt;
      if (data.proof !== undefined) fields.proof = data.proof;

      // Update the record
      await airtable(TASKS_TABLE).update([
        {
          id: records[0].id,
          fields,
        },
      ]);
    } catch (error) {
      console.error("Error updating task in Airtable:", error);
    }
  }

  // Achievement operations
  async createAchievement(achievement: Achievement): Promise<void> {
    try {
      await airtable(ACHIEVEMENTS_TABLE).create([
        {
          fields: {
            id: achievement.id,
            user_id: achievement.userId,
            title: achievement.title,
            description: achievement.description,
            unlocked_at: achievement.unlockedAt,
            xp_reward: achievement.xpReward,
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating achievement in Airtable:", error);
    }
  }
}

export const airtableService = new AirtableService();
