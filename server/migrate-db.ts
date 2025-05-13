import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema";

/**
 * Run database migrations
 */
export async function migrateDatabase() {
  console.log("Running database migrations...");
  
  try {
    // Since we're using SQLite, we'll use a simple approach to add columns
    // This will create the necessary tables and columns
    
    // For our changes, we'll modify the SQLite database directly
    // Get the underlying SQLite database connection
    const dbClient = (db as any).$client;
    
    // Check if requires_proof column exists in chores table
    const hasRequiresProofColumn = dbClient.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('chores') 
      WHERE name = 'requires_proof'
    `).get().count > 0;
    
    // Add requires_proof column if it doesn't exist
    if (!hasRequiresProofColumn) {
      console.log("Adding requires_proof column to chores table...");
      dbClient.prepare(`ALTER TABLE chores ADD COLUMN requires_proof INTEGER DEFAULT 0`).run();
      console.log("requires_proof column added successfully.");
    } else {
      console.log("requires_proof column already exists, skipping.");
    }
    
    // Check if reward_claims table exists
    const hasRewardClaimsTable = dbClient.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' AND name='reward_claims'
    `).get().count > 0;
    
    // Create reward_claims table if it doesn't exist
    if (!hasRewardClaimsTable) {
      console.log("Creating reward_claims table...");
      dbClient.prepare(`
        CREATE TABLE reward_claims (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reward_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          reviewed_by INTEGER,
          reviewed_at INTEGER,
          feedback TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (reward_id) REFERENCES rewards(id),
          FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
      `).run();
      console.log("reward_claims table created successfully.");
    } else {
      console.log("reward_claims table already exists, skipping.");
    }
    
    // Check if rewards table has claimed column
    const hasClaimedColumn = dbClient.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('rewards') 
      WHERE name = 'claimed'
    `).get().count > 0;
    
    // Add claimed column to rewards table if it doesn't exist
    if (!hasClaimedColumn) {
      console.log("Adding claimed column to rewards table...");
      dbClient.prepare(`ALTER TABLE rewards ADD COLUMN claimed INTEGER DEFAULT 0`).run();
      console.log("claimed column added successfully.");
    } else {
      console.log("claimed column already exists, skipping.");
    }
    
    console.log("Database migrations completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during database migration:", error);
    throw error;
  }
}