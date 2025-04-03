// Script to run database migrations for Netlify deployment
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent of __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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