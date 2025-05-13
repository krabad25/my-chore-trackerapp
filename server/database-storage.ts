import {
  users,
  chores,
  rewards,
  achievements,
  choreCompletions,
  rewardClaims,
  type User,
  type InsertUser,
  type Chore,
  type InsertChore,
  type Reward,
  type InsertReward,
  type Achievement,
  type InsertAchievement,
  type ChoreCompletion,
  type InsertChoreCompletion,
  type RewardClaim,
  type InsertRewardClaim,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, between } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
  
  async getUsersByFamilyId(familyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.familyId, familyId));
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Chore operations
  async getChores(userId: number): Promise<Chore[]> {
    return await db.select().from(chores).where(eq(chores.userId, userId));
  }
  
  async getChore(id: number): Promise<Chore | undefined> {
    const [chore] = await db.select().from(chores).where(eq(chores.id, id));
    return chore;
  }
  
  async createChore(insertChore: InsertChore): Promise<Chore> {
    const [chore] = await db.insert(chores).values(insertChore).returning();
    return chore;
  }
  
  async updateChore(id: number, data: Partial<Chore>): Promise<Chore | undefined> {
    const [updatedChore] = await db
      .update(chores)
      .set(data)
      .where(eq(chores.id, id))
      .returning();
    return updatedChore;
  }
  
  async deleteChore(id: number): Promise<boolean> {
    const result = await db.delete(chores).where(eq(chores.id, id)).returning();
    return result.length > 0;
  }
  
  // Reward operations
  async getRewards(userId: number): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.userId, userId));
  }
  
  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }
  
  async createReward(insertReward: InsertReward): Promise<Reward> {
    const [reward] = await db.insert(rewards).values(insertReward).returning();
    return reward;
  }
  
  async updateReward(id: number, data: Partial<Reward>): Promise<Reward | undefined> {
    const [updatedReward] = await db
      .update(rewards)
      .set(data)
      .where(eq(rewards.id, id))
      .returning();
    return updatedReward;
  }
  
  async deleteReward(id: number): Promise<boolean> {
    const result = await db.delete(rewards).where(eq(rewards.id, id)).returning();
    return result.length > 0;
  }
  
  // Achievement operations
  async getAchievements(userId: number): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }
  
  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(insertAchievement).returning();
    return achievement;
  }
  
  async updateAchievement(id: number, data: Partial<Achievement>): Promise<Achievement | undefined> {
    const [updatedAchievement] = await db
      .update(achievements)
      .set(data)
      .where(eq(achievements.id, id))
      .returning();
    return updatedAchievement;
  }
  
  // Chore Completion operations
  async completeChore(completion: InsertChoreCompletion): Promise<ChoreCompletion> {
    // Make sure the completion has a pending status
    const completionData = {
      ...completion,
      status: "pending"
    };
    
    // Create the completion record
    const [choreCompletion] = await db
      .insert(choreCompletions)
      .values(completionData)
      .returning();
    
    // Update chore to completed
    await db
      .update(chores)
      .set({ completed: true })
      .where(eq(chores.id, completion.choreId));
    
    // Points will be awarded when a parent approves the completion
    return choreCompletion;
  }
  
  async getChoreCompletions(userId: number): Promise<ChoreCompletion[]> {
    return await db
      .select()
      .from(choreCompletions)
      .where(eq(choreCompletions.userId, userId));
  }
  
  async getChoreCompletion(id: number): Promise<ChoreCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(choreCompletions)
      .where(eq(choreCompletions.id, id));
    return completion;
  }
  
  async getChoreCompletionsByStatus(userId: number, status: string): Promise<ChoreCompletion[]> {
    return await db
      .select()
      .from(choreCompletions)
      .where(
        and(
          eq(choreCompletions.userId, userId),
          eq(choreCompletions.status, status)
        )
      );
  }
  
  async updateChoreCompletion(id: number, data: Partial<ChoreCompletion>): Promise<ChoreCompletion | undefined> {
    const [updatedCompletion] = await db
      .update(choreCompletions)
      .set(data)
      .where(eq(choreCompletions.id, id))
      .returning();
    return updatedCompletion;
  }
  
  async getCompletionsInDateRange(userId: number, startDate: Date, endDate: Date): Promise<ChoreCompletion[]> {
    // Convert JavaScript dates to Unix timestamps (seconds)
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    
    return await db
      .select()
      .from(choreCompletions)
      .where(
        and(
          eq(choreCompletions.userId, userId),
          between(choreCompletions.completedAt, startTimestamp, endTimestamp)
        )
      );
  }
  
  // Reward Claim operations
  async claimReward(insertClaim: InsertRewardClaim): Promise<RewardClaim> {
    // Create the reward claim
    const [claim] = await db
      .insert(rewardClaims)
      .values({
        ...insertClaim,
        status: "pending"
      })
      .returning();
    
    // Update the reward status
    await db
      .update(rewards)
      .set({ claimed: true })
      .where(eq(rewards.id, insertClaim.rewardId));
    
    return claim;
  }
  
  async getRewardClaims(userId: number): Promise<RewardClaim[]> {
    return await db
      .select()
      .from(rewardClaims)
      .where(eq(rewardClaims.userId, userId));
  }
  
  async getRewardClaim(id: number): Promise<RewardClaim | undefined> {
    const [claim] = await db
      .select()
      .from(rewardClaims)
      .where(eq(rewardClaims.id, id));
    return claim;
  }
  
  async getRewardClaimsByStatus(status: string): Promise<RewardClaim[]> {
    return await db
      .select()
      .from(rewardClaims)
      .where(eq(rewardClaims.status, status));
  }
  
  async updateRewardClaim(id: number, data: Partial<RewardClaim>): Promise<RewardClaim | undefined> {
    const [updatedClaim] = await db
      .update(rewardClaims)
      .set(data)
      .where(eq(rewardClaims.id, id))
      .returning();
    return updatedClaim;
  }
  
  // Initialize with default data
  async initializeDefaultData() {
    // Check if we already have a default user
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      // Create default user with Isabela as the child
      const [user] = await db.insert(users).values({
        username: "default",
        password: "password",
        isParent: false,
        childName: "Isabela",
        points: 0,
        parentPin: "1234"
      }).returning();
      
      const userId = user.id;
      
      // Add default chores
      await db.insert(chores).values([
        {
          title: "Make the bed",
          points: 5,
          imageUrl: "",
          frequency: "daily",
          completed: false,
          userId
        },
        {
          title: "Put away toys",
          points: 10,
          imageUrl: "",
          frequency: "daily",
          completed: false,
          userId
        },
        {
          title: "Help set the table",
          points: 15,
          imageUrl: "",
          frequency: "weekly",
          completed: false,
          userId
        },
        {
          title: "Water the plants",
          points: 10,
          imageUrl: "",
          frequency: "weekly",
          completed: false,
          userId
        }
      ]);
      
      // Add default rewards
      await db.insert(rewards).values([
        {
          title: "Extra Screen Time",
          points: 30,
          imageUrl: "",
          claimed: false,
          userId
        },
        {
          title: "Ice Cream Treat",
          points: 40,
          imageUrl: "",
          claimed: false,
          userId
        },
        {
          title: "Trip to the Park",
          points: 50,
          imageUrl: "",
          claimed: false,
          userId
        },
        {
          title: "New Toy",
          points: 100,
          imageUrl: "",
          claimed: false,
          userId
        }
      ]);
      
      // Add default achievements
      await db.insert(achievements).values([
        {
          title: "First Chore",
          icon: "ri-rocket-line",
          unlocked: true,
          userId
        },
        {
          title: "1 Week Streak",
          icon: "ri-calendar-check-line",
          unlocked: true,
          userId
        },
        {
          title: "10 Chores",
          icon: "ri-award-line",
          unlocked: false,
          userId
        }
      ]);
    }
  }
}