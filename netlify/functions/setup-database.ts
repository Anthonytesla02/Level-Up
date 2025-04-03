import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';

// Helper function to generate a random string
const generateRandomString = (length: number) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

const handler: Handler = async (event, context) => {
  // Only allow POST requests for security
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { action = 'check' } = body;
    
    // Check for existing database connection
    if (process.env.DATABASE_URL) {
      // Test if the connection works
      const sql = neon(process.env.DATABASE_URL);
      const db = drizzle(sql, { schema });
      
      // Try to query the database (this will fail if tables don't exist)
      try {
        const result = await db.select().from(schema.users).limit(1);
        
        // If we're asked to initialize tables but they already exist
        if (action === 'initialize') {
          return {
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              message: 'Database tables already exist',
              alreadyInitialized: true,
            }),
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Database connection configured and working',
            tablesExist: true,
          }),
        };
      } catch (queryError) {
        // If tables don't exist and we're asked to initialize
        if (action === 'initialize') {
          try {
            // Create database schema using Drizzle ORM
            console.log('Creating database tables...');
            
            // Create users table
            await sql`
              CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                xp INTEGER NOT NULL DEFAULT 0,
                credits INTEGER NOT NULL DEFAULT 100,
                title VARCHAR(255) NOT NULL DEFAULT 'Novice',
                profile_image VARCHAR(255),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                last_login_date TIMESTAMP
              )
            `;
            
            // Create tasks table
            await sql`
              CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(255) NOT NULL,
                difficulty VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'active',
                due_date TIMESTAMP,
                completed_date TIMESTAMP,
                proof_type VARCHAR(50) NOT NULL,
                xp_reward INTEGER NOT NULL,
                failure_penalty_type VARCHAR(50),
                failure_penalty_amount INTEGER,
                is_daily_challenge BOOLEAN NOT NULL DEFAULT FALSE,
                is_special_challenge BOOLEAN NOT NULL DEFAULT FALSE,
                ai_recommendation TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
              )
            `;
            
            // Create punishment_options table
            await sql`
              CREATE TABLE IF NOT EXISTS punishment_options (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id),
                description TEXT NOT NULL,
                penalty_type VARCHAR(50) NOT NULL,
                penalty_amount INTEGER NOT NULL,
                is_selected BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
              )
            `;
            
            // Create achievements table
            await sql`
              CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                icon VARCHAR(255),
                acquired_at TIMESTAMP NOT NULL DEFAULT NOW(),
                xp_reward INTEGER NOT NULL DEFAULT 0
              )
            `;
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                success: true,
                message: 'Database tables created successfully',
                initialized: true,
              }),
            };
          } catch (initError) {
            console.error('Error creating database tables:', initError);
            return {
              statusCode: 500,
              body: JSON.stringify({
                success: false,
                error: 'Failed to create database tables',
                message: initError instanceof Error ? initError.message : 'Unknown error',
              }),
            };
          }
        }
        
        // If we're just checking status and tables don't exist
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Database connection working but tables do not exist',
            tablesExist: false,
          }),
        };
      }
    }

    // If no DATABASE_URL is set, this function will not work without a Neon account
    // We will provide instructions instead
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: false,
        message: 'No DATABASE_URL environment variable found',
        instructions: [
          '1. Sign up for a free Neon PostgreSQL account at https://neon.tech',
          '2. Create a new project',
          '3. Get your connection string from the Neon dashboard',
          '4. Add it as DATABASE_URL in your Netlify environment variables',
          '5. Re-deploy your site',
        ],
      }),
    };
  } catch (error) {
    console.error('Error setting up database:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to set up database connection',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };