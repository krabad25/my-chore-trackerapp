import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Initialize SQLite database
const sqlite = new Database('sqlite.db');

// Create drizzle database instance with schema
export const db = drizzle(sqlite, { schema });

// Run the setup script to create tables if they don't exist
import './setup-db';