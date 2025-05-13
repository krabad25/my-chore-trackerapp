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

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Directory creation handled above

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
    // Log the request body for debugging
    console.log("Login request body:", req.body);
    
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      console.log(`Attempting login for username: ${username}`);
      const user = await storage.getUserByUsername(username);
      console.log("User found:", !!user);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      console.log("User authenticated, session set with userId:", user.id);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
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
  app.post("/api/user/photo", isAuthenticated, (req, res, next) => {
    // Handle multipart form data upload
    upload.single("photo")(req, res, async (err) => {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({ message: err.message || "File upload error" });
      }
    
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      try {
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
      } catch (error) {
        console.error("Photo upload processing error:", error);
        res.status(500).json({ message: "Error processing photo upload" });
      }
    });
  });
  
  // Update user avatar from URL
  app.put("/api/user/:id/avatar", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { avatarUrl } = req.body;
      
      if (!avatarUrl) {
        return res.status(400).json({ message: "No avatar URL provided" });
      }
      
      // Ensure the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Security check: ensure users can only update their own avatar (unless they're a parent)
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (currentUser.id !== userId && currentUser.role !== "parent") {
        return res.status(403).json({ message: "Not authorized to update this user's avatar" });
      }
      
      // Update the user's profile photo with the avatar URL
      const updatedUser = await storage.updateUser(userId, {
        profilePhoto: avatarUrl
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update avatar" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json({
        message: "Avatar updated successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      return res.status(500).json({ message: "Failed to update avatar" });
    }
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
  
  app.post("/api/chores/:id/complete", upload.single("proofImage"), async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const chore = await storage.getChore(id);
      
      // Make sure the chore exists
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      // Check if the user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get the user who is submitting the completion
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if this chore requires proof
      const requiresProof = chore.requiresProof === true;
      
      let proofImageUrl = null;
      
      // If proof is required, validate and process the proof image
      if (requiresProof) {
        // Check if proof image was provided when required
        if (!req.file) {
          return res.status(400).json({ message: "Proof image is required to complete this chore" });
        }
        
        // Save the image and get its URL
        const filename = `proof-${user.id}-${Date.now()}${path.extname(req.file.originalname)}`;
        const targetPath = path.join("uploads", filename);
        
        fs.renameSync(req.file.path, targetPath);
        proofImageUrl = `/uploads/${filename}`;
      }
      
      // Create the chore completion record
      // Auto-approve if parent OR if proof is not required
      const approveImmediately = user.role === "parent" || !requiresProof;
      const now = Math.floor(Date.now() / 1000);
      
      const completion = insertChoreCompletionSchema.parse({
        choreId: id,
        userId: user.id,
        proofImageUrl,
        status: approveImmediately ? "approved" : "pending",
        reviewedBy: approveImmediately ? user.id : undefined,
        reviewedAt: approveImmediately ? now : undefined
      });
      
      const choreCompletion = await storage.completeChore(completion);
      
      // Update chore as completed
      const updatedChore = await storage.updateChore(id, { completed: true });
      
      // Different message based on whether the chore was auto-approved or not
      const message = approveImmediately 
        ? "Chore completed successfully!" 
        : "Chore submitted for review";
      
      // If the chore was auto-approved and the user is a child, award points immediately
      if (approveImmediately && user.role === "child") {
        // Award points directly to the user
        const updatedUser = await storage.updateUser(user.id, { 
          points: (user.points || 0) + chore.points 
        });
        
        res.status(201).json({
          message,
          completion: choreCompletion,
          chore: updatedChore,
          user: updatedUser || user, // Return updated user if available
          pointsAwarded: chore.points,
          autoApproved: true
        });
      } else {
        res.status(201).json({
          message,
          completion: choreCompletion,
          chore: updatedChore,
          user,
          autoApproved: approveImmediately
        });
      }
    } catch (error) {
      console.error("Chore completion error:", error);
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
  
  app.post("/api/rewards/:id/claim", isAuthenticated, async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      
      // Get the reward
      const reward = await storage.getReward(id);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Get the user requesting the claim
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough points
      if ((user.points ?? 0) < reward.points) {
        return res.status(400).json({ 
          message: "Not enough points to claim this reward",
          required: reward.points,
          available: user.points
        });
      }
      
      // Update the reward to be claimed 
      const updatedReward = await storage.updateReward(id, { 
        claimed: true
        // Note: Additional claim tracking will be added in a future update
      });
      
      if (!updatedReward) {
        return res.status(500).json({ message: "Failed to claim reward" });
      }
      
      // Deduct points from the user
      const updatedUser = await storage.updateUser(userId, { 
        points: (user.points ?? 0) - reward.points 
      });
      
      // Send back the updated data
      res.json({
        message: "Reward claimed successfully",
        reward: updatedReward,
        user: {
          id: updatedUser?.id,
          points: updatedUser?.points
        }
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      res.status(400).json({ message: "Invalid reward claim data" });
    }
  });
  
  // Get pending chore completions - for parent review
  app.get("/api/chore-completions/pending", isParent, async (req: Request, res: Response) => {
    try {
      // Get all users in the family
      const parentUser = await storage.getUser(req.session.userId!);
      if (!parentUser) {
        return res.status(404).json({ message: "Parent user not found" });
      }
      
      const familyMembers = await storage.getUsersByFamilyId(parentUser.familyId);
      const childUsers = familyMembers.filter(user => user.role === 'child');
      
      // No children in family yet
      if (childUsers.length === 0) {
        return res.json([]);
      }
      
      // Get pending completions for all children in the family
      const pendingCompletions = [];
      for (const child of childUsers) {
        const completions = await storage.getChoreCompletionsByStatus(child.id, 'pending');
        
        // For each completion, get the associated chore details
        for (const completion of completions) {
          const chore = await storage.getChore(completion.choreId);
          if (chore) {
            pendingCompletions.push({
              completion,
              chore,
              child
            });
          }
        }
      }
      
      res.json(pendingCompletions);
    } catch (error) {
      console.error("Error fetching pending completions:", error);
      res.status(500).json({ message: "Failed to fetch pending completions" });
    }
  });
  
  // Review a chore completion - approve or reject
  app.post("/api/chore-completions/:id/review", isParent, async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    const reviewSchema = z.object({
      status: z.enum(["approved", "rejected"]),
      feedback: z.string().optional()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const { status, feedback } = reviewSchema.parse(req.body);
      
      // Get the completion
      const completion = await storage.getChoreCompletion(id);
      if (!completion) {
        return res.status(404).json({ message: "Completion not found" });
      }
      
      // Update the completion status
      const updatedCompletion = await storage.updateChoreCompletion(id, {
        status,
        reviewedBy: req.session.userId!,
        reviewedAt: Math.floor(Date.now() / 1000)
      });
      
      // If approved, award points to the child
      if (status === "approved") {
        const chore = await storage.getChore(completion.choreId);
        if (chore) {
          const user = await storage.getUser(completion.userId);
          if (user) {
            const currentPoints = user.points || 0;
            await storage.updateUser(user.id, {
              points: currentPoints + chore.points
            });
          }
        }
      }
      
      res.json({
        message: `Chore completion ${status}`,
        completion: updatedCompletion
      });
    } catch (error) {
      console.error("Error reviewing completion:", error);
      res.status(400).json({ message: "Invalid review data" });
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
