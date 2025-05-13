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
    
    console.log("Database migrations completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during database migration:", error);
    throw error;
  }
}