import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Add type augmentation for multer file
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}
import { 
  insertChoreSchema,
  insertRewardSchema,
  insertChoreCompletionSchema,
} from "@shared/schema";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authorization middleware and route handlers

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Middleware to check if user is a parent
  const isParent = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'parent') {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };

  // User authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const loginSchema = z.object({
      username: z.string().min(1),
      password: z.string().min(1)
    });
    
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        token: "session-auth" // Placeholder for session-based auth
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Legacy parent PIN validation (for backward compatibility)
  app.post("/api/auth/parent", async (req: Request, res: Response) => {
    const pinSchema = z.object({
      pin: z.string().min(4).max(6)
    });
    
    try {
      const { pin } = pinSchema.parse(req.body);
      
      // Find parent user with matching password
      const parentUsers = await storage.getUsersByRole('parent');
      const parentUser = parentUsers.find(user => user.password === pin);
      
      if (!parentUser) {
        return res.status(401).json({ message: "Invalid PIN" });
      }
      
      // Set parent user ID in session
      req.session.userId = parentUser.id;
      
      res.json({ message: "PIN validated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid PIN format" });
    }
  });
  
  // Get current user
  app.get("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Get user by ID - only accessible to parents or self
  app.get("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const requestingUser = await storage.getUser(req.session.userId!);
      
      // Only allow access if requesting user is a parent or the same user
      if (requestingUser?.role !== 'parent' && req.session.userId !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });
  
  // Get family members - only accessible to parents
  app.get("/api/family", isAuthenticated, async (req: Request, res: Response) => {
    const requestingUser = await storage.getUser(req.session.userId!);
    if (!requestingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const familyMembers = await storage.getUsersByFamilyId(requestingUser.familyId);
    
    // Filter out passwords
    const safeMembers = familyMembers.map(member => {
      const { password, ...memberWithoutPassword } = member;
      return memberWithoutPassword;
    });
    
    res.json(safeMembers);
  });
  
  // Update user photo
  app.post("/api/user/photo", isAuthenticated, upload.single("photo"), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const filename = `profile-${Date.now()}${path.extname(req.file.originalname)}`;
    const targetPath = path.join("uploads", filename);
    
    fs.renameSync(req.file.path, targetPath);
    
    // Update the user's profile photo
    const profilePhotoUrl = `/uploads/${filename}`;
    const updatedUser = await storage.updateUser(user.id, { 
      profilePhoto: profilePhotoUrl 
    });
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user photo" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ message: "Photo uploaded successfully", user: userWithoutPassword });
  });
  
  // Update user points - parents can update any child's points
  app.put("/api/user/:id/points", isAuthenticated, async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    const pointsSchema = z.object({
      points: z.number().int()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const { points } = pointsSchema.parse(req.body);
      
      const requestingUser = await storage.getUser(req.session.userId!);
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only parents can update points for others
      if (requestingUser.role !== 'parent' && req.session.userId !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }
      
      const updatedUser = await storage.updateUser(id, { points });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update points" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  
  // Chore routes
  app.get("/api/chores", async (req: Request, res: Response) => {
    const chores = await storage.getChores(1);
    res.json(chores);
  });
  
  app.post("/api/chores", async (req: Request, res: Response) => {
    try {
      const newChore = insertChoreSchema.parse({
        ...req.body,
        userId: 1
      });
      
      const chore = await storage.createChore(newChore);
      res.status(201).json(chore);
    } catch (error) {
      res.status(400).json({ message: "Invalid chore data" });
    }
  });
  
  app.put("/api/chores/:id", async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const chore = await storage.getChore(id);
      
      if (!chore || chore.userId !== 1) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      const updatedChore = await storage.updateChore(id, req.body);
      if (!updatedChore) {
        return res.status(500).json({ message: "Failed to update chore" });
      }
      
      res.json(updatedChore);
    } catch (error) {
      res.status(400).json({ message: "Invalid chore data" });
    }
  });
  
  app.delete("/api/chores/:id", async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const chore = await storage.getChore(id);
      
      if (!chore || chore.userId !== 1) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      const deleted = await storage.deleteChore(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete chore" });
      }
      
      res.json({ message: "Chore deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid chore ID" });
    }
  });
  
  app.post("/api/chores/:id/complete", async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const chore = await storage.getChore(id);
      
      if (!chore || chore.userId !== 1) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      const completion = insertChoreCompletionSchema.parse({
        choreId: id,
        userId: 1
      });
      
      const choreCompletion = await storage.completeChore(completion);
      const user = await storage.getUser(1);
      
      res.json({
        completion: choreCompletion,
        chore,
        user
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid chore completion data" });
    }
  });
  
  // Reward routes
  app.get("/api/rewards", async (req: Request, res: Response) => {
    const rewards = await storage.getRewards(1);
    res.json(rewards);
  });
  
  app.post("/api/rewards", async (req: Request, res: Response) => {
    try {
      const newReward = insertRewardSchema.parse({
        ...req.body,
        userId: 1
      });
      
      const reward = await storage.createReward(newReward);
      res.status(201).json(reward);
    } catch (error) {
      res.status(400).json({ message: "Invalid reward data" });
    }
  });
  
  app.put("/api/rewards/:id", async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const reward = await storage.getReward(id);
      
      if (!reward || reward.userId !== 1) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      const updatedReward = await storage.updateReward(id, req.body);
      if (!updatedReward) {
        return res.status(500).json({ message: "Failed to update reward" });
      }
      
      res.json(updatedReward);
    } catch (error) {
      res.status(400).json({ message: "Invalid reward data" });
    }
  });
  
  app.delete("/api/rewards/:id", async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const reward = await storage.getReward(id);
      
      if (!reward || reward.userId !== 1) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      const deleted = await storage.deleteReward(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete reward" });
      }
      
      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid reward ID" });
    }
  });
  
  app.post("/api/rewards/:id/claim", async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const reward = await storage.getReward(id);
      
      if (!reward || reward.userId !== 1) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if ((user.points ?? 0) < reward.points) {
        return res.status(400).json({ 
          message: "Not enough points to claim this reward" 
        });
      }
      
      // Update the reward to be claimed and deduct points
      const updatedReward = await storage.updateReward(id, { claimed: true });
      if (!updatedReward) {
        return res.status(500).json({ message: "Failed to claim reward" });
      }
      
      const updatedUser = await storage.updateUser(1, { 
        points: (user.points ?? 0) - reward.points 
      });
      
      res.json({
        reward: updatedReward,
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid reward claim data" });
    }
  });
  
  // Achievement routes
  app.get("/api/achievements", async (req: Request, res: Response) => {
    const achievements = await storage.getAchievements(1);
    res.json(achievements);
  });
  
  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));
  
  const httpServer = createServer(app);
  
  return httpServer;
}
