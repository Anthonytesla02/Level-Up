import express, { Request, Response, NextFunction } from 'express';
import serverless from 'serverless-http';
import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from '../../shared/schema';
import { storage } from '../../server/storage';
import { registerRoutes } from '../../server/routes';

// Initialize express app
const app = express();
app.use(express.json());

// Setup database connection
const setupDatabase = async () => {
  // Try to connect using the DATABASE_URL environment variable first
  let connectionString = process.env.DATABASE_URL;
  
  // If no database URL is provided, throw an error
  if (!connectionString) {
    throw new Error('No DATABASE_URL environment variable found');
  }
  
  // For serverless environments like Netlify, we'll use Neon's HTTP connection
  if (process.env.NETLIFY) {
    try {
      const sql = neon(connectionString);
      const db = drizzleNeon(sql, { schema });
      
      // Return a compatible interface with what the storage expects
      return { 
        db, 
        pool: null, // We don't have a pool with Neon HTTP
        // We're returning an object that looks like it has a pool for compatibility
        neonDb: true 
      };
    } catch (error) {
      console.error('Error connecting to Neon:', error);
      throw error;
    }
  } 
  // For local development, use the regular PostgreSQL Pool
  else {
    try {
      const pool = new Pool({ connectionString });
      const db = drizzlePg(pool, { schema });
      return { pool, db, neonDb: false };
    } catch (error) {
      console.error('Error connecting to PostgreSQL:', error);
      throw error;
    }
  }
};

// Initialize database and start API server
let isInitialized = false;
const initializeApi = async (req: Request, res: Response, next: NextFunction) => {
  if (!isInitialized) {
    try {
      const { pool, db } = await setupDatabase();
      // Store the pool and db instances for later use
      app.locals.pool = pool;
      app.locals.db = db;
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return res.status(500).json({ error: 'Failed to connect to database' });
    }
  }
  next();
};

// Apply the initialization middleware to all requests
app.use(initializeApi);

// Register all routes from the server routes
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Export the serverless handler
export const handler = serverless(app);