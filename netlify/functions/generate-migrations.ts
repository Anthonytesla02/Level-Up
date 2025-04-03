import { Handler } from '@netlify/functions';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// This function will be used during the build process to generate migrations
const handler: Handler = async (event, context) => {
  // Only allow POST requests for security
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check if drizzle directory exists
    const drizzleDir = path.join(process.cwd(), 'drizzle');
    if (!fs.existsSync(drizzleDir)) {
      fs.mkdirSync(drizzleDir, { recursive: true });
    }

    // Generate migrations using drizzle-kit
    const { stdout, stderr } = await execAsync('npx drizzle-kit generate:pg');
    
    if (stderr && !stderr.includes('Done')) {
      throw new Error(stderr);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Migrations generated successfully',
        details: stdout,
      }),
    };
  } catch (error) {
    console.error('Error generating migrations:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate migrations',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };