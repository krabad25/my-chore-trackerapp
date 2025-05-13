import Database from 'better-sqlite3';

// Initialize SQLite database
const sqlite = new Database('sqlite.db');

function main() {
  console.log('Setting up database...');
  
  // Delete existing database tables to avoid schema conflicts
  sqlite.exec(`
    DROP TABLE IF EXISTS reward_claims;
    DROP TABLE IF EXISTS chore_completions;
    DROP TABLE IF EXISTS achievements;
    DROP TABLE IF EXISTS rewards;
    DROP TABLE IF EXISTS chores;
    DROP TABLE IF EXISTS users;
  `);

  // Create the tables manually with updated schema
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      profile_photo TEXT,
      points INTEGER DEFAULT 0,
      parent_id INTEGER,
      family_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      points INTEGER NOT NULL,
      image_url TEXT,
      frequency TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      user_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      duration INTEGER,
      is_duration_chore INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      points INTEGER NOT NULL,
      image_url TEXT,
      claimed INTEGER DEFAULT 0,
      user_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      icon TEXT NOT NULL,
      unlocked INTEGER DEFAULT 0,
      user_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chore_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      completed_at INTEGER DEFAULT (unixepoch()),
      status TEXT DEFAULT 'pending',
      proof_image_url TEXT,
      reviewed_by INTEGER,
      reviewed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS reward_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      claimed_at INTEGER DEFAULT (unixepoch()),
      status TEXT DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at INTEGER
    );
  `);
  
  // Check if we already have data
  const existingUsers = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (existingUsers.count === 0) {
    console.log('Initializing default data...');
    
    // Create a family ID
    const familyId = 1;
    
    // Create parent user with AntuAbad/antuantuantu
    const parentId = sqlite.prepare(`
      INSERT INTO users (username, password, role, name, points, family_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('AntuAbad', 'antuantuantu', 'parent', 'Parent', 0, familyId).lastInsertRowid;
    
    // Create child user (Isabela)
    const childId = sqlite.prepare(`
      INSERT INTO users (username, password, role, name, points, parent_id, family_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('isabela', '123456', 'child', 'Isabela', 0, parentId, familyId).lastInsertRowid;
    
    // Use child ID as our main user ID for the application
    const userId = childId;
    
    // Add default chores
    const insertChore = sqlite.prepare(`
      INSERT INTO chores (title, points, image_url, frequency, completed, user_id, duration, is_duration_chore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertChore.run('Make the bed', 5, '', 'daily', 0, userId, null, 0);
    insertChore.run('Put away toys', 10, '', 'daily', 0, userId, null, 0);
    insertChore.run('Help set the table', 15, '', 'weekly', 0, userId, null, 0);
    insertChore.run('Water the plants', 10, '', 'weekly', 0, userId, null, 0);
    insertChore.run('Brush teeth for 2 minutes', 5, '', 'daily', 0, userId, 2, 1);
    
    // Add default rewards
    const insertReward = sqlite.prepare(`
      INSERT INTO rewards (title, points, image_url, claimed, user_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertReward.run('Extra Screen Time', 30, '', 0, userId);
    insertReward.run('Ice Cream Treat', 40, '', 0, userId);
    insertReward.run('Trip to the Park', 50, '', 0, userId);
    insertReward.run('New Toy', 100, '', 0, userId);
    
    // Add default achievements
    const insertAchievement = sqlite.prepare(`
      INSERT INTO achievements (title, icon, unlocked, user_id)
      VALUES (?, ?, ?, ?)
    `);
    
    insertAchievement.run('First Chore', 'ri-rocket-line', 1, userId);
    insertAchievement.run('1 Week Streak', 'ri-calendar-check-line', 1, userId);
    insertAchievement.run('10 Chores', 'ri-award-line', 0, userId);
  }
  
  console.log('Database setup complete!');
}

main();