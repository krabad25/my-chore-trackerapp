import Database from 'better-sqlite3';

// Initialize SQLite database
const sqlite = new Database('sqlite.db');

function main() {
  console.log('Setting up database...');
  
  // Create the tables manually
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_parent INTEGER DEFAULT 0,
      child_name TEXT,
      profile_photo TEXT,
      points INTEGER DEFAULT 0,
      parent_pin TEXT
    );

    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      points INTEGER NOT NULL,
      image_url TEXT,
      frequency TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      user_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
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
      completed_at INTEGER DEFAULT (unixepoch())
    );
  `);
  
  // Check if we already have data
  const existingUsers = sqlite.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (existingUsers.count === 0) {
    console.log('Initializing default data...');
    
    // Create default user
    const userId = sqlite.prepare(`
      INSERT INTO users (username, password, is_parent, child_name, points, parent_pin)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('default', 'password', 0, 'Isabela', 0, '1234').lastInsertRowid;
    
    // Add default chores
    const insertChore = sqlite.prepare(`
      INSERT INTO chores (title, points, image_url, frequency, completed, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertChore.run('Make the bed', 5, '', 'daily', 0, userId);
    insertChore.run('Put away toys', 10, '', 'daily', 0, userId);
    insertChore.run('Help set the table', 15, '', 'weekly', 0, userId);
    insertChore.run('Water the plants', 10, '', 'weekly', 0, userId);
    
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