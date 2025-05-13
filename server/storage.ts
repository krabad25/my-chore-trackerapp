import {
  users,
  chores,
  rewards,
  achievements,
  choreCompletions,
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
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByFamilyId(familyId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Chore operations
  getChores(userId: number): Promise<Chore[]>;
  getChore(id: number): Promise<Chore | undefined>;
  createChore(chore: InsertChore): Promise<Chore>;
  updateChore(id: number, data: Partial<Chore>): Promise<Chore | undefined>;
  deleteChore(id: number): Promise<boolean>;
  
  // Reward operations
  getRewards(userId: number): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, data: Partial<Reward>): Promise<Reward | undefined>;
  deleteReward(id: number): Promise<boolean>;
  
  // Achievement operations
  getAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, data: Partial<Achievement>): Promise<Achievement | undefined>;
  
  // Chore Completion operations
  completeChore(completion: InsertChoreCompletion): Promise<ChoreCompletion>;
  getChoreCompletions(userId: number): Promise<ChoreCompletion[]>;
  getCompletionsInDateRange(userId: number, startDate: Date, endDate: Date): Promise<ChoreCompletion[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chores: Map<number, Chore>;
  private rewards: Map<number, Reward>;
  private achievements: Map<number, Achievement>;
  private choreCompletions: Map<number, ChoreCompletion>;
  
  private userId: number = 1;
  private choreId: number = 1;
  private rewardId: number = 1;
  private achievementId: number = 1;
  private choreCompletionId: number = 1;
  
  constructor() {
    this.users = new Map();
    this.chores = new Map();
    this.rewards = new Map();
    this.achievements = new Map();
    this.choreCompletions = new Map();

    // Create a family
    const familyId = 1;
    
    // Create a parent user
    this.createUser({
      username: "AntuAbad",
      password: "antuantuantu",
      role: "parent",
      name: "Parent",
      familyId,
      points: null,
      profilePhoto: null,
      parentId: null
    });
    
    // Create a child user (Isabela)
    this.createUser({
      username: "isabela",
      password: "123456",
      role: "child",
      name: "Isabela",
      familyId,
      points: 50,
      profilePhoto: "/assets/Isabela.jpg",
      parentId: 1
    });
    
    // Add default chores for Isabela (userId: 2)
    this.createChore({
      title: "Make the bed",
      points: 5,
      imageUrl: "",
      frequency: "daily",
      completed: false,
      userId: 2
    });
    
    this.createChore({
      title: "Put away toys",
      points: 10,
      imageUrl: "",
      frequency: "daily",
      completed: false,
      userId: 2
    });
    
    this.createChore({
      title: "Help set the table",
      points: 15,
      imageUrl: "",
      frequency: "weekly",
      completed: false,
      userId: 2
    });
    
    this.createChore({
      title: "Water the plants",
      points: 10,
      imageUrl: "",
      frequency: "weekly",
      completed: false,
      userId: 2
    });
    
    // Add default rewards for Isabela (userId: 2)
    this.createReward({
      title: "Extra Screen Time",
      points: 30,
      imageUrl: "",
      claimed: false,
      userId: 2
    });
    
    this.createReward({
      title: "Ice Cream Treat",
      points: 40,
      imageUrl: "",
      claimed: false,
      userId: 2
    });
    
    this.createReward({
      title: "Trip to the Park",
      points: 50,
      imageUrl: "",
      claimed: false,
      userId: 2
    });
    
    this.createReward({
      title: "New Toy",
      points: 100,
      imageUrl: "",
      claimed: false,
      userId: 2
    });
    
    // Add default achievements for Isabela (userId: 2)
    this.createAchievement({
      title: "First Chore",
      icon: "ri-rocket-line",
      unlocked: true,
      userId: 2
    });
    
    this.createAchievement({
      title: "1 Week Streak",
      icon: "ri-calendar-check-line",
      unlocked: true,
      userId: 2
    });
    
    this.createAchievement({
      title: "10 Chores",
      icon: "ri-award-line",
      unlocked: false,
      userId: 2
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }
  
  async getUsersByFamilyId(familyId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.familyId === familyId
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Chore operations
  async getChores(userId: number): Promise<Chore[]> {
    return Array.from(this.chores.values()).filter(
      (chore) => chore.userId === userId
    );
  }
  
  async getChore(id: number): Promise<Chore | undefined> {
    return this.chores.get(id);
  }
  
  async createChore(insertChore: InsertChore): Promise<Chore> {
    const id = this.choreId++;
    const now = new Date();
    const chore: Chore = { 
      ...insertChore, 
      id, 
      createdAt: now
    };
    
    this.chores.set(id, chore);
    return chore;
  }
  
  async updateChore(id: number, data: Partial<Chore>): Promise<Chore | undefined> {
    const chore = this.chores.get(id);
    if (!chore) return undefined;
    
    const updatedChore = { ...chore, ...data };
    this.chores.set(id, updatedChore);
    return updatedChore;
  }
  
  async deleteChore(id: number): Promise<boolean> {
    return this.chores.delete(id);
  }
  
  // Reward operations
  async getRewards(userId: number): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter(
      (reward) => reward.userId === userId
    );
  }
  
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }
  
  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = this.rewardId++;
    const now = new Date();
    const reward: Reward = { 
      ...insertReward, 
      id, 
      createdAt: now
    };
    
    this.rewards.set(id, reward);
    return reward;
  }
  
  async updateReward(id: number, data: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewards.get(id);
    if (!reward) return undefined;
    
    const updatedReward = { ...reward, ...data };
    this.rewards.set(id, updatedReward);
    return updatedReward;
  }
  
  async deleteReward(id: number): Promise<boolean> {
    return this.rewards.delete(id);
  }
  
  // Achievement operations
  async getAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(
      (achievement) => achievement.userId === userId
    );
  }
  
  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const achievement: Achievement = { ...insertAchievement, id };
    
    this.achievements.set(id, achievement);
    return achievement;
  }
  
  async updateAchievement(id: number, data: Partial<Achievement>): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement = { ...achievement, ...data };
    this.achievements.set(id, updatedAchievement);
    return updatedAchievement;
  }
  
  // Chore Completion operations
  async completeChore(insertCompletion: InsertChoreCompletion): Promise<ChoreCompletion> {
    const id = this.choreCompletionId++;
    const now = new Date();
    const completion: ChoreCompletion = { 
      ...insertCompletion, 
      id, 
      completedAt: now
    };
    
    this.choreCompletions.set(id, completion);
    
    // Update the chore to be completed
    const chore = this.chores.get(insertCompletion.choreId);
    if (chore) {
      this.updateChore(chore.id, { completed: true });
      
      // Add points to user
      const user = this.users.get(insertCompletion.userId);
      if (user) {
        this.updateUser(user.id, { points: (user.points || 0) + chore.points });
      }
    }
    
    return completion;
  }
  
  async getChoreCompletions(userId: number): Promise<ChoreCompletion[]> {
    return Array.from(this.choreCompletions.values()).filter(
      (completion) => completion.userId === userId
    );
  }
  
  async getCompletionsInDateRange(userId: number, startDate: Date, endDate: Date): Promise<ChoreCompletion[]> {
    return Array.from(this.choreCompletions.values()).filter(
      (completion) => 
        completion.userId === userId && 
        completion.completedAt >= startDate && 
        completion.completedAt <= endDate
    );
  }
}

import { DatabaseStorage } from './database-storage';
export const storage = new DatabaseStorage();
