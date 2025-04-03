import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const sourceFile = path.resolve(__dirname, '../public/_redirects');
const targetDir = path.resolve(__dirname, '../dist');
const targetFile = path.resolve(targetDir, '_redirects');

// Ensure the dist directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Copy the _redirects file
try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Copied _redirects file to: ${targetFile}`);
} catch (error) {
  console.error('Error copying _redirects file:', error);
  process.exit(1);
}