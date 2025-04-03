# Level-Up: Gamified Task Manager

A gamified self-improvement mobile web application that transforms personal task management into an engaging, RPG-like experience using AI-driven motivation and interactive design.

## Technologies Used

- **Frontend**: React.js, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Mistral AI for task generation
- **Deployment**: Netlify with serverless functions

## Deployment Guide

### Prerequisites

1. Create accounts on:
   - [GitHub](https://github.com/) for source control
   - [Netlify](https://www.netlify.com/) for hosting
   - [Neon](https://neon.tech/) for PostgreSQL database

### Setup Steps

1. **Fork/Clone Repository**
   ```
   git clone https://github.com/yourusername/Level-Up.git
   cd Level-Up
   ```

2. **Install Dependencies**
   ```
   npm install
   ```

3. **Database Setup**
   - Create a new database in Neon
   - Get your database connection string

4. **Netlify Configuration**
   - Connect your GitHub repository to Netlify
   - Set the following environment variables in Netlify:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `GITHUB_TOKEN`: (If using GitHub API features)
     - Any other required API keys

5. **Deploy**
   - Netlify will automatically deploy your app on push to the main branch
   - The first deployment will set up the database automatically

### Local Development

1. **Start the development server**
   ```
   npm run dev
   ```

2. **Database Migration**
   ```
   npm run db:push
   ```

## Features

- AI-generated daily challenges
- RPG-style leveling system
- Task management with difficulty levels
- Failure consequences (penalties)
- User profile progression
- Mobile-first responsive design