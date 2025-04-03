// Script to run database migrations for Netlify deployment
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { migrate } = require('drizzle-orm/neon-http/migrator');
const path = require('path');

// Main migration function
async function runMigrations() {
  // Check for database URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('Starting database migration...');
  
  try {
    // Connect to the database
    const sql = neon(databaseUrl);
    const db = drizzle(sql);
    
    // Run migrations
    const migrationsFolder = path.join(__dirname, '../../drizzle');
    console.log(`Using migrations from ${migrationsFolder}`);
    
    await migrate(db, { migrationsFolder });
    
    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run the migration
runMigrations();