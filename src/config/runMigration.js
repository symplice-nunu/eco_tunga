const db = require('./database');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'migrations', 'add_role_column.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Split SQL statements and execute them separately
    const statements = sql.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      await db.query(statement);
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 