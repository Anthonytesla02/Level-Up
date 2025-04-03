// Netlify build script for setting up the database before deployment
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent of __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure drizzle directory exists
const drizzleDir = path.join(__dirname, '..', 'drizzle');
if (!fs.existsSync(drizzleDir)) {
  fs.mkdirSync(drizzleDir, { recursive: true });
  console.log('Created drizzle directory');
}

try {
  // Generate Drizzle migrations if needed
  execSync('npx drizzle-kit generate:pg', { stdio: 'inherit' });
  console.log('Generated Drizzle migrations');
} catch (error) {
  console.error('Error generating migrations:', error);
  // Continue anyway, as the build should not fail if migrations can't be generated
}

// Check if we're running in Netlify production environment and have a database URL
if (process.env.NETLIFY && process.env.DATABASE_URL) {
  try {
    console.log('Database configuration detected in Netlify environment');
    
    // Run migrations using our migration script
    const migrationScriptPath = path.join(__dirname, 'scripts/migrate.js');
    if (fs.existsSync(migrationScriptPath)) {
      console.log('Running database migrations...');
      execSync(`node --experimental-specifier-resolution=node ${migrationScriptPath}`, { stdio: 'inherit' });
      console.log('Database migrations applied successfully!');
    } else {
      console.warn('Migration script not found at:', migrationScriptPath);
      console.log('Skipping automated migrations');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    // Continue anyway, as the database connection will be handled at runtime
    console.log('Build will continue, but you may need to run migrations manually');
  }
} else {
  console.log('No DATABASE_URL environment variable found or not running in Netlify');
  console.log('Database will need to be set up after deployment');
}

console.log('Build script completed successfully');