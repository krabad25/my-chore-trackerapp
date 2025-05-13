// Script to update database schema
import sqlite3 from 'better-sqlite3';
const db = sqlite3('sqlite.db');

console.log('Starting database schema update...');

try {
  // Check if the column already exists
  const tableInfo = db.prepare("PRAGMA table_info(chores)").all();
  const columnExists = tableInfo.some(column => column.name === 'requires_proof');
  
  if (!columnExists) {
    console.log('Adding requires_proof column to chores table...');
    // Add the requires_proof column with default value of 1 (true)
    db.prepare("ALTER TABLE chores ADD COLUMN requires_proof INTEGER DEFAULT 1").run();
    console.log('Column added successfully!');
  } else {
    console.log('Column requires_proof already exists.');
  }
  
  console.log('Database schema update completed successfully!');
} catch (error) {
  console.error('Error updating database schema:', error);
} finally {
  db.close();
}