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
  insertRewardClaimSchema,
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
      
      // Return user data (except password)
      const { password: _, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
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
  
  app.post("/api/auth/parent", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // Always use the first parent account (id: 1) as the parent for now
      const parent = await storage.getUser(1);
      
      if (!parent || parent.password !== password) {
        return res.status(401).json({ message: "Invalid parent password" });
      }
      
      // Set user ID in session to the parent's ID
      req.session.userId = parent.id;
      
      // Return parent user data (except password)
      const { password: _, ...userData } = parent;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get user info
  app.get("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get specific user
  app.get("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number().int().positive()
      });
      
      const { id } = idSchema.parse(req.params);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only return own user or child users for parent
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (currentUser.id !== user.id && currentUser.role !== 'parent') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Return user data without password
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get family members
  app.get("/api/family", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const familyMembers = await storage.getUsersByFamilyId(currentUser.familyId);
      
      // Return user data without passwords
      const familyData = familyMembers.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      res.json(familyData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Upload or update user avatar
  app.put("/api/user/:id/avatar", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number().int().positive()
      });
      
      const { id } = idSchema.parse(req.params);
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Users can only update their own avatar, unless they're a parent
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (currentUser.id !== user.id && currentUser.role !== 'parent') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { avatarUrl } = req.body;
      if (!avatarUrl) {
        return res.status(400).json({ message: "Avatar URL is required" });
      }
      
      // Update user avatar
      const updatedUser = await storage.updateUser(id, { 
        profilePhoto: avatarUrl 
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update avatar" });
      }
      
      // Return updated user
      res.json({ 
        message: "Avatar updated successfully", 
        user: updatedUser 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update user points
  app.put("/api/user/:id/points", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number().int().positive()
      });
      
      const { id } = idSchema.parse(req.params);
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only parents can manually update points
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (currentUser.role !== 'parent') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { points } = req.body;
      if (typeof points !== 'number') {
        return res.status(400).json({ message: "Valid points value is required" });
      }
      
      // Update user points
      const updatedUser = await storage.updateUser(id, { points });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update points" });
      }
      
      // Return updated user
      res.json({ 
        message: "Points updated successfully", 
        user: updatedUser 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get user's chore completions by status
  app.get("/api/chore-completions/user/:id/:status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const paramsSchema = z.object({
        id: z.coerce.number().int().positive(),
        status: z.enum(["pending", "approved", "rejected"]),
      });
      
      const { id, status } = paramsSchema.parse(req.params);
      
      // Check if accessing own completions or parent accessing child's
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      const userId = id;
      
      // Only allow users to see their own completions, or parents to see any
      if (currentUser.id !== userId && currentUser.role !== 'parent') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const completions = await storage.getChoreCompletionsByStatus(userId, status);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching user completions:", error);
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });
  
  // Get all chore completions for the current user
  app.get("/api/chore-completions/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const completions = await storage.getChoreCompletions(req.session.userId);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching user's chore completions:", error);
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });
  
  app.get("/api/chores", async (req: Request, res: Response) => {
    const chores = await storage.getChores(1);
    res.json(chores);
  });
  
  app.post("/api/chores", isParent, async (req: Request, res: Response) => {
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
  
  // Upload chore image
  app.post("/api/chores/upload", isParent, upload.single("choreImage"), async (req: Request, res: Response) => {
    try {
      console.log("Received chore upload request:", req.body);
      console.log("File:", req.file);
      
      // Validate request data
      if (!req.body.title || !req.body.points || !req.body.frequency) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const points = parseInt(req.body.points);
      if (isNaN(points) || points < 1 || points > 100) {
        return res.status(400).json({ message: "Points must be between 1 and 100" });
      }
      
      // Parse other fields
      const requiresProof = req.body.requiresProof === "true";
      const isDurationChore = req.body.isDurationChore === "true";
      let duration = undefined;
      
      if (isDurationChore && req.body.duration) {
        duration = parseInt(req.body.duration);
        if (isNaN(duration) || duration < 1 || duration > 120) {
          return res.status(400).json({ message: "Duration must be between 1 and 120 minutes" });
        }
      }
      
      let imageUrl = "";
      
      // If there's an uploaded file, save it to the uploads directory
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
        console.log("Image saved at:", imageUrl);
      }
      
      // Create the chore with the image URL
      const chore = await storage.createChore({
        title: req.body.title,
        points,
        frequency: req.body.frequency,
        imageUrl,
        userId: 1, // Parent user
        isDurationChore: isDurationChore || false,
        duration: duration,
        requiresProof: requiresProof
      });
      
      res.status(201).json(chore);
    } catch (error) {
      console.error("Error uploading chore image:", error);
      res.status(500).json({ message: "Failed to upload chore image" });
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
      const success = await storage.deleteChore(id);
      
      if (!success) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      res.json({ message: "Chore deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid chore ID" });
    }
  });
  
  // Complete a chore
  app.post("/api/chores/:id/complete", upload.single("proofImage"), async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      
      // Ensure the user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if chore exists
      const chore = await storage.getChore(id);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
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
      const isParent = user.role === "parent";
      const noProofRequired = !requiresProof;
      const approveImmediately = isParent || noProofRequired;
      
      console.log("[Chore Complete] Approval decision:", {
        userRole: user.role,
        requiresProof,
        isParent,
        noProofRequired,
        approveImmediately
      });
      
      const now = Math.floor(Date.now() / 1000);
      
      // IMPORTANT: For pending status, do NOT set reviewedBy at all
      const status = approveImmediately ? "approved" : "pending";
      
      const completionData: any = {
        choreId: id,
        userId: user.id,
        proofImageUrl,
        status,
        completedAt: now
      };
      
      // Only add review fields if auto-approved
      if (approveImmediately) {
        completionData.reviewedBy = user.id;
        completionData.reviewedAt = now;
      }
      
      console.log("[Chore Complete] Creating chore completion with data:", completionData);
      
      const completion = insertChoreCompletionSchema.parse(completionData);
      
      const choreCompletion = await storage.completeChore(completion);
      
      // Update chore as completed
      const updatedChore = await storage.updateChore(id, { completed: true });
      
      // Different message based on whether the chore was auto-approved or not
      const message = approveImmediately 
        ? "Chore completed successfully!" 
        : "Chore completion submitted for parent approval.";
      
      // If auto-approved, award points immediately
      if (approveImmediately) {
        const currentPoints = user.points || 0;
        const newPoints = currentPoints + chore.points;
        await storage.updateUser(user.id, { points: newPoints });
      }
      
      // Add details about the operation outcome for better client-side handling
      const responseData = {
        message,
        choreCompletion,
        chore: updatedChore,
        redirectUrl: '/chores',
        points: approveImmediately ? chore.points : 0,
        success: true,
        status: approveImmediately ? "approved" : "pending"
      };
      
      console.log("[Chore Complete] Success response:", {
        choreId: id,
        userId: user.id, 
        approved: approveImmediately,
        pointsAwarded: approveImmediately ? chore.points : 0
      });
      
      res.status(201).json(responseData);
    } catch (error) {
      console.error("[Chore Complete] Error:", error);
      
      // More detailed error response
      let errorMessage = "Failed to complete chore";
      let statusCode = 400;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error types
        if (error.message.includes("Unauthorized")) {
          statusCode = 401;
        } else if (error.message.includes("not found")) {
          statusCode = 404;
        } 
      }
      
      // Send error response with redirect back to chores page
      res.status(statusCode).json({ 
        success: false, 
        message: errorMessage,
        redirectUrl: '/chores' // Still provide a redirect URL even on error
      });
    }
  });
  
  // Get all rewards
  app.get("/api/rewards", async (req: Request, res: Response) => {
    const rewards = await storage.getRewards(1);
    res.json(rewards);
  });
  
  // Create a new reward (parent only)
  app.post("/api/rewards", isParent, async (req: Request, res: Response) => {
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
  
  // Upload reward image
  app.post("/api/rewards/upload", isParent, upload.single("rewardImage"), async (req: Request, res: Response) => {
    try {
      console.log("Received reward upload request:", req.body);
      console.log("File:", req.file);
      
      // Validate request data
      if (!req.body.title || !req.body.points) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const points = parseInt(req.body.points);
      if (isNaN(points) || points < 1 || points > 100) {
        return res.status(400).json({ message: "Points must be between 1 and 100" });
      }
      
      // Process the image
      let imageUrl = "";
      
      if (req.file) {
        // Rename the file to include "reward-" prefix for better organization
        const originalName = req.file.originalname.replace(/[^a-zA-Z0-9\.]/g, '_');
        const fileName = `reward-${Date.now()}-${originalName}`;
        const uploadPath = path.join("uploads", fileName);
        
        // Move the temporary file to the permanent location
        fs.renameSync(req.file.path, uploadPath);
        imageUrl = `/uploads/${fileName}`;
        console.log("Image saved at:", imageUrl);
      }
      
      // Create the reward with the image URL
      const reward = await storage.createReward({
        title: req.body.title,
        points,
        imageUrl,
        userId: 1, // Parent user
      });
      
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error uploading reward image:", error);
      res.status(500).json({ message: "Failed to upload reward image" });
    }
  });
  
  // Update a reward
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
  
  // Delete a reward
  app.delete("/api/rewards/:id", async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const success = await storage.deleteReward(id);
      
      if (!success) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid reward ID" });
    }
  });
  
  // Claim a reward
  app.post("/api/rewards/:id/claim", isAuthenticated, async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      
      // Check if reward exists
      const reward = await storage.getReward(id);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Get the user who is claiming the reward
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough points
      if (user.points < reward.points) {
        return res.status(400).json({ 
          message: "Not enough points", 
          pointsNeeded: reward.points - user.points
        });
      }
      
      // Create claim record
      const claim = insertRewardClaimSchema.parse({
        rewardId: id,
        userId: user.id,
        status: "pending",
      });
      
      const rewardClaim = await storage.claimReward(claim);
      
      // For parent users, auto-approve the claim
      if (user.role === "parent") {
        const now = Math.floor(Date.now() / 1000);
        await storage.updateRewardClaim(rewardClaim.id, {
          status: "approved",
          reviewedBy: user.id,
          reviewedAt: now
        });
        
        // Update user points
        const newPoints = user.points - reward.points;
        await storage.updateUser(user.id, { points: newPoints });
        
        // Mark reward as claimed
        await storage.updateReward(id, { claimed: true });
        
        return res.status(201).json({ 
          message: "Reward claimed successfully", 
          rewardClaim,
          pointsLeft: newPoints
        });
      }
      
      // For child users, submit for parent approval
      res.status(201).json({ 
        message: "Reward claim request submitted for parent approval", 
        rewardClaim
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      res.status(400).json({ message: "Invalid reward claim data" });
    }
  });
  
  // Get reward claims for current user
  app.get("/api/reward-claims/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const claims = await storage.getRewardClaims(userId);
      
      // Populate with reward details
      const claimsWithDetails = await Promise.all(
        claims.map(async (claim) => {
          const reward = await storage.getReward(claim.rewardId);
          return {
            ...claim,
            reward
          };
        })
      );
      
      res.json(claimsWithDetails);
    } catch (error) {
      console.error("Error fetching user reward claims:", error);
      res.status(500).json({ message: "Failed to fetch user reward claims" });
    }
  });
  
  // Get pending reward claims - for parent approval
  app.get("/api/reward-claims/pending", isParent, async (req: Request, res: Response) => {
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
      
      // Get pending claims for all children in the family
      const pendingClaims = [];
      
      // Get all pending claims
      const claims = await storage.getRewardClaimsByStatus("pending");
      
      // Filter claims for children in this family and add reward and child details
      for (const claim of claims) {
        const child = childUsers.find(child => child.id === claim.userId);
        if (child) {
          const reward = await storage.getReward(claim.rewardId);
          if (reward) {
            pendingClaims.push({
              claim,
              reward,
              child
            });
          }
        }
      }
      
      res.json(pendingClaims);
    } catch (error) {
      console.error("Error fetching pending reward claims:", error);
      res.status(500).json({ message: "Failed to fetch pending reward claims" });
    }
  });
  
  // Review a reward claim (approve/reject)
  app.post("/api/reward-claims/:id/review", isParent, async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const { status } = req.body;
      
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      
      // Get the claim
      const claim = await storage.getRewardClaim(id);
      if (!claim) {
        return res.status(404).json({ message: "Reward claim not found" });
      }
      
      // Make sure claim is pending
      if (claim.status !== "pending") {
        return res.status(400).json({ message: "Reward claim has already been reviewed" });
      }
      
      // Get the reward
      const reward = await storage.getReward(claim.rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Get the child user
      const child = await storage.getUser(claim.userId);
      if (!child) {
        return res.status(404).json({ message: "Child user not found" });
      }
      
      // Update claim status
      const now = Math.floor(Date.now() / 1000);
      const updatedClaim = await storage.updateRewardClaim(id, {
        status,
        reviewedBy: req.session.userId,
        reviewedAt: now
      });
      
      if (status === "approved") {
        // Deduct points from the child
        const newPoints = child.points - reward.points;
        await storage.updateUser(child.id, { points: newPoints });
        
        // Mark reward as claimed
        await storage.updateReward(reward.id, { claimed: true });
        
        res.json({ 
          message: "Reward claim approved", 
          claim: updatedClaim,
          reward,
          child: { ...child, points: newPoints }
        });
      } else {
        // If rejected, no points are deducted
        res.json({ 
          message: "Reward claim rejected", 
          claim: updatedClaim
        });
      }
    } catch (error) {
      console.error("Error reviewing reward claim:", error);
      res.status(400).json({ message: "Invalid reward claim review data" });
    }
  });
  
  // Get pending chore completions - for parent approval
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
      
      // Get all pending completions where user ID is one of our child users
      // First, get all pending completions regardless of user
      console.log("[Pending Chores] Looking for pending chore completions");
      const allPendingCompletions = await Promise.all(
        childUsers.map(child => 
          storage.getChoreCompletionsByStatus(child.id, "pending")
        )
      );
      
      // Flatten the array of arrays
      const completions = allPendingCompletions.flat();
      
      console.log("[Pending Chores] Found completions:", completions.length);
      
      // Filter completions for children in this family and add chore and child details
      for (const completion of completions) {
        const child = childUsers.find(child => child.id === completion.userId);
        if (child) {
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
      console.error("Error fetching pending chore completions:", error);
      res.status(500).json({ message: "Failed to fetch pending chore completions" });
    }
  });
  
  // Review a chore completion (approve/reject)
  app.post("/api/chore-completions/:id/review", isParent, async (req: Request, res: Response) => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive()
    });
    
    try {
      const { id } = idSchema.parse(req.params);
      const { status } = req.body;
      
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      
      // Get the completion
      const completion = await storage.getChoreCompletion(id);
      if (!completion) {
        return res.status(404).json({ message: "Chore completion not found" });
      }
      
      // Make sure completion is pending
      if (completion.status !== "pending") {
        return res.status(400).json({ message: "Chore completion has already been reviewed" });
      }
      
      // Get the chore
      const chore = await storage.getChore(completion.choreId);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      // Get the child user
      const child = await storage.getUser(completion.userId);
      if (!child) {
        return res.status(404).json({ message: "Child user not found" });
      }
      
      // Update completion status
      const now = Math.floor(Date.now() / 1000);
      const updatedCompletion = await storage.updateChoreCompletion(id, {
        status,
        reviewedBy: req.session.userId,
        reviewedAt: now
      });
      
      if (status === "approved") {
        // Award points to the child
        const newPoints = child.points + chore.points;
        await storage.updateUser(child.id, { points: newPoints });
        
        res.json({ 
          message: "Chore completion approved", 
          completion: updatedCompletion,
          chore,
          child: { ...child, points: newPoints }
        });
      } else {
        // If rejected, no points are awarded
        // Also, mark the chore as not completed so it can be done again
        await storage.updateChore(chore.id, { completed: false });
        
        res.json({ 
          message: "Chore completion rejected", 
          completion: updatedCompletion,
          chore: { ...chore, completed: false }
        });
      }
    } catch (error) {
      console.error("Error reviewing chore completion:", error);
      res.status(400).json({ message: "Invalid chore completion review data" });
    }
  });
  
  // Get all achievements
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId || 2; // Default to child user for now
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}