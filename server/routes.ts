import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { 
  loginSchema, 
  registerSchema, 
  insertTaskSchema, 
  insertPunishmentOptionSchema,
  completeTaskSchema,
  selectPunishmentSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer } from "ws";
import { 
  generateTask, 
  generateAllUserDailyTasks, 
  shouldGenerateTasksToday 
} from "./services/mistralai";

// Configure express-session
const configureSession = (app: Express) => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "solo-leveling-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      store: storage.sessionStore,
    })
  );
};

// Configure passport
const configurePassport = (app: Express) => {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());
};

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Configure session and passport
  configureSession(app);
  configurePassport(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
  });
  
  console.log("WebSocket server initialized");
  
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("message", (message) => {
      console.log("Received message:", message);
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Store user data in Airtable - commented out as we're now using PostgreSQL
      /*//await airtableService.createUser({});
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        level: user.level,
        xp: user.xp,
        xpass: user.xpass,
        title: user.title,
        streak: user.streak,
        isLocked: user.isLocked
      });*/
      
      // Auto login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login after registration" });
        }
        return res.status(201).json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          level: user.level,
          xp: user.xp,
          xpass: user.xpass,
          title: user.title,
          streak: user.streak
        });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message || "Invalid credentials" });
        }
        
        // Check if user account is locked
        if (user.isLocked) {
          return res.status(403).json({ message: "Your account is locked. Complete your failed tasks to unlock." });
        }
        
        req.login(user, async (err) => {
          if (err) {
            return next(err);
          }
          
          // Update last login date
          const updatedUser = await storage.updateUser(user.id, {
            lastLoginDate: new Date()
          });
          
          return res.json({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            level: user.level,
            xp: user.xp,
            xpass: user.xpass,
            title: user.title,
            streak: user.streak
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User routes
  app.get("/api/user", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      level: user.level,
      xp: user.xp,
      xpass: user.xpass,
      title: user.title,
      streak: user.streak,
      isLocked: user.isLocked
    });
  });

  app.get("/api/user/stats", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    const activeTasks = await storage.getActiveTasksByUserId(user.id);
    const completedTasks = await storage.getCompletedTasksByUserId(user.id);
    
    // Calculate XP needed for next level
    // Formula: 1000 * level * 1.5
    const currentXp = user.xp;
    const nextLevelXp = Math.floor(1000 * user.level * 1.5);
    const xpPercentage = Math.min(Math.floor((currentXp / nextLevelXp) * 100), 100);
    
    res.json({
      active: activeTasks.length,
      completed: completedTasks.length,
      streak: user.streak,
      currentXp,
      nextLevelXp,
      xpPercentage
    });
  });

  // Task routes
  app.get("/api/tasks", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Get all tasks for the user
    const tasks = await storage.getTasksByUserId(user.id);
    
    res.json(tasks);
  });

  app.get("/api/tasks/active", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Get active tasks for the user
    const tasks = await storage.getActiveTasksByUserId(user.id);
    
    res.json(tasks);
  });

  app.get("/api/tasks/completed", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Get completed tasks for the user
    const tasks = await storage.getCompletedTasksByUserId(user.id);
    
    res.json(tasks);
  });

  app.get("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Ensure user can only access their own tasks
    const user = req.user as any;
    if (task.userId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get punishment options for this task
    const punishmentOptions = await storage.getPunishmentsByTaskId(taskId);
    
    res.json({
      ...task,
      punishmentOptions
    });
  });

  app.post("/api/tasks", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const taskData = insertTaskSchema.parse(req.body);
      
      // Calculate XP reward based on difficulty
      let xpReward = 50; // Default for easy
      if (taskData.difficulty === "medium") {
        xpReward = 150;
      } else if (taskData.difficulty === "hard") {
        xpReward = 300;
      }
      
      // Create task
      const task = await storage.createTask({
        ...taskData,
        userId: user.id,
        xpReward
      });
      
      // Create punishment options
      const createPunishments = [
        // XP punishment (lose the amount that would have been rewarded)
        storage.createPunishment({
          taskId: task.id,
          type: "xp",
          value: xpReward.toString()
        }),
        // XPass punishment (half the XP reward)
        storage.createPunishment({
          taskId: task.id,
          type: "xpass",
          value: Math.floor(xpReward / 3).toString()
        }),
        // Physical punishment (based on difficulty)
        storage.createPunishment({
          taskId: task.id,
          type: "physical",
          value: taskData.difficulty === "easy" 
            ? "20 Push-ups" 
            : taskData.difficulty === "medium" 
              ? "35 Burpees" 
              : "50 Burpees"
        })
      ];
      
      await Promise.all(createPunishments);
      
      // Save to Airtable - commented out as we are now using PostgreSQL
      //await airtableService.createTask(task);
      
      res.status(201).json(task);
      
      // Broadcast new task
      broadcast({
        type: "NEW_TASK",
        data: task
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.post("/api/tasks/complete", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { taskId, proof } = completeTaskSchema.parse(req.body);
      
      // Get task
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if task belongs to user
      if (task.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if task is active
      if (task.status !== "active") {
        return res.status(400).json({ message: "Task is not active" });
      }
      
      // Check if task has expired
      if (new Date(task.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Task has expired" });
      }
      
      // Mark task as completed
      const updatedTask = await storage.updateTask(taskId, {
        status: "completed",
        completedAt: new Date(),
        proof
      });
      
      // Award XP to user
      const currentXp = user.xp + task.xpReward;
      const currentLevel = user.level;
      
      // Calculate XP needed for next level
      const nextLevelXp = Math.floor(1000 * currentLevel * 1.5);
      
      // Check if user leveled up
      let newLevel = currentLevel;
      let leveledUp = false;
      
      if (currentXp >= nextLevelXp) {
        newLevel = currentLevel + 1;
        leveledUp = true;
      }
      
      // Update user with new XP and possibly new level
      const updatedUser = await storage.updateUser(user.id, {
        xp: currentXp,
        level: newLevel,
        // Update streak
        streak: user.streak + 1
      });
      
      // Update user in Airtable - commented out as we're now using PostgreSQL
      // await airtableService.updateUser(user.id, {
      //   xp: currentXp,
      //   level: newLevel,
      //   streak: user.streak + 1
      // });
      
      // Update task in Airtable - commented out as we're now using PostgreSQL
      // await airtableService.updateTask(task.id, {
      //   status: "completed",
      //   completedAt: new Date(),
      //   proof
      // });
      
      // Return response with task and user info
      res.json({
        task: updatedTask,
        userUpdate: {
          previousXp: user.xp,
          newXp: currentXp,
          previousLevel: currentLevel,
          newLevel,
          leveledUp
        }
      });
      
      // Broadcast task completion
      broadcast({
        type: "TASK_COMPLETED",
        data: {
          task: updatedTask,
          userUpdate: {
            previousXp: user.xp,
            newXp: currentXp,
            previousLevel: currentLevel,
            newLevel,
            leveledUp
          }
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  app.post("/api/tasks/punishment", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { taskId, punishmentId } = selectPunishmentSchema.parse(req.body);
      
      // Get task
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if task belongs to user
      if (task.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Make sure task has failed
      if (task.status !== "failed") {
        return res.status(400).json({ message: "Task has not failed" });
      }
      
      // Get punishment option
      const punishmentOptions = await storage.getPunishmentsByTaskId(taskId);
      const punishment = punishmentOptions.find(p => p.id === punishmentId);
      
      if (!punishment) {
        return res.status(404).json({ message: "Punishment option not found" });
      }
      
      // Apply punishment based on type
      if (punishment.type === "xp") {
        const xpLoss = parseInt(punishment.value);
        // Ensure XP doesn't go below 0
        const newXp = Math.max(0, user.xp - xpLoss);
        await storage.updateUser(user.id, {
          xp: newXp,
          isLocked: false // Unlock user
        });
        
        // Update in Airtable - commented out as we are now using PostgreSQL
        // await airtableService.updateUser(user.id, {
        //   xp: newXp,
        //   isLocked: false
        // });
      } else if (punishment.type === "xpass") {
        const xpassCost = parseInt(punishment.value);
        
        // Check if user has enough XPass
        if (user.xpass < xpassCost) {
          return res.status(400).json({ message: "Not enough XPass credits" });
        }
        
        // Deduct XPass
        await storage.updateUser(user.id, {
          xpass: user.xpass - xpassCost,
          isLocked: false // Unlock user
        });
        
        // Update in Airtable - commented out as we are now using PostgreSQL
        // await airtableService.updateUser(user.id, {
        //   xpass: user.xpass - xpassCost,
        //   isLocked: false
        // });
      } else if (punishment.type === "physical") {
        // For physical punishments, we just unlock the account
        // as we have to trust the user completed the challenge
        await storage.updateUser(user.id, {
          isLocked: false
        });
        
        // Update in Airtable - commented out as we are now using PostgreSQL
        // await airtableService.updateUser(user.id, {
        //   isLocked: false
        // });
      }
      
      // Update the task
      await storage.updateTask(taskId, {
        status: "punished"
      });
      
      // Update in Airtable - commented out as we are now using PostgreSQL
      // await airtableService.updateTask(task.id, {
      //   status: "punished"
      // });
      
      // Get updated user
      const updatedUser = await storage.getUser(user.id);
      
      res.json({
        message: "Punishment applied successfully",
        user: {
          id: updatedUser?.id,
          username: updatedUser?.username,
          displayName: updatedUser?.displayName,
          email: updatedUser?.email,
          level: updatedUser?.level,
          xp: updatedUser?.xp,
          xpass: updatedUser?.xpass,
          title: updatedUser?.title,
          streak: updatedUser?.streak,
          isLocked: updatedUser?.isLocked
        }
      });
      
      // Broadcast punishment applied
      broadcast({
        type: "PUNISHMENT_APPLIED",
        data: {
          task,
          punishment,
          user: updatedUser
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to apply punishment" });
    }
  });

  // Suggested task routes (pre-defined, not using AI)
  app.get("/api/tasks/suggest", ensureAuthenticated, async (req, res) => {
    try {
      // Return pre-defined task suggestions
      const suggestions = [
        {
          title: "Complete a Workout",
          description: "Exercise for at least 30 minutes today",
          difficulty: "medium",
          category: "fitness",
          proofType: "photo",
          xpReward: 150,
        },
        {
          title: "Read a Book",
          description: "Read at least 30 pages of a non-fiction book",
          difficulty: "easy",
          category: "personal",
          proofType: "text",
          xpReward: 50,
        },
        {
          title: "Learn Something New",
          description: "Spend 1 hour learning a new skill online",
          difficulty: "medium",
          category: "education",
          proofType: "text",
          xpReward: 150,
        },
        {
          title: "Meal Preparation",
          description: "Prepare healthy meals for the next 3 days",
          difficulty: "hard",
          category: "health",
          proofType: "photo",
          xpReward: 300,
        },
        {
          title: "Mindfulness Meditation",
          description: "Complete a 15-minute meditation session",
          difficulty: "easy",
          category: "mental",
          proofType: "text",
          xpReward: 50,
        }
      ];
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task suggestions" });
    }
  });

  app.post("/api/tasks/accept-suggestion", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const taskData = insertTaskSchema.parse(req.body);
      
      // Create the suggested task
      const task = await storage.createTask({
        ...taskData,
        userId: user.id,
        createdBy: "suggestion"
      });
      
      // Create punishment options
      const createPunishments = [
        storage.createPunishment({
          taskId: task.id,
          type: "xp",
          value: task.xpReward.toString()
        }),
        storage.createPunishment({
          taskId: task.id,
          type: "xpass",
          value: Math.floor(task.xpReward / 3).toString()
        }),
        storage.createPunishment({
          taskId: task.id,
          type: "physical",
          value: taskData.difficulty === "easy" 
            ? "20 Push-ups" 
            : taskData.difficulty === "medium" 
              ? "35 Burpees" 
              : "50 Burpees"
        })
      ];
      
      await Promise.all(createPunishments);
      
      res.status(201).json(task);
      
      // Broadcast new task
      broadcast({
        type: "NEW_TASK",
        data: task
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to accept task suggestion" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Get all achievements for the user
    const achievements = await storage.getAchievementsByUserId(user.id);
    
    res.json(achievements);
  });

  // XPass routes
  app.post("/api/xpass/add", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { amount } = req.body;
      
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Add XPass to user
      const updatedUser = await storage.updateUser(user.id, {
        xpass: user.xpass + amount
      });
      
      // Update in Airtable - commented out as we are now using PostgreSQL
      // await airtableService.updateUser(user.id, {
      //   xpass: user.xpass + amount
      // });
      
      res.json({
        message: "XPass added successfully",
        xpass: updatedUser?.xpass
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add XPass" });
    }
  });

  // Background task to check for expired tasks
  setInterval(async () => {
    try {
      // Get expired tasks
      const expiredTasks = await storage.getExpiredTasks();
      
      // Mark each task as failed and lock the user
      for (const task of expiredTasks) {
        await storage.updateTask(task.id, {
          status: "failed"
        });
        
        // Lock the user
        const user = await storage.getUser(task.userId);
        if (user) {
          await storage.updateUser(user.id, {
            isLocked: true
          });
          
          // Update in Airtable - commented out as we are now using PostgreSQL
          // await airtableService.updateTask(task.id, {
          //   status: "failed"
          // });
          
          // await airtableService.updateUser(user.id, {
          //   isLocked: true
          // });
          
          // Broadcast task failed
          broadcast({
            type: "TASK_FAILED",
            data: {
              task,
              user
            }
          });
        }
      }
    } catch (error) {
      console.error("Error checking expired tasks:", error);
    }
  }, 60 * 1000); // Check every minute

  // AI Task Generation Routes
  app.get("/api/ai/daily-tasks", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if we've already generated tasks today
      const shouldGenerate = shouldGenerateTasksToday(user.lastTaskGenerationDate);
      
      if (!shouldGenerate) {
        // Return existing active tasks filtered by those generated today
        const tasks = await storage.getActiveTasksByUserId(user.id);
        
        // We need to filter by createdAt to get today's tasks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
        
        return res.json(todaysTasks);
      }
      
      // Generate daily tasks using Mistral AI
      const allTasks = await generateAllUserDailyTasks(user);
      
      // Save all tasks to the database
      const savedTasks = await Promise.all(
        allTasks.map(task => storage.createTask(task))
      );
      
      // For each task, create punishment options
      for (const task of savedTasks) {
        const punishments = [
          // XP punishment (lose the amount that would have been rewarded)
          storage.createPunishment({
            taskId: task.id,
            type: "xp",
            value: task.xpReward.toString()
          }),
          // XPass punishment (third of the XP reward)
          storage.createPunishment({
            taskId: task.id,
            type: "xpass",
            value: Math.floor(task.xpReward / 3).toString()
          }),
          // Physical punishment (based on difficulty)
          storage.createPunishment({
            taskId: task.id,
            type: "physical",
            value: task.difficulty === "easy" 
              ? "20 Push-ups" 
              : task.difficulty === "medium" 
                ? "35 Burpees" 
                : "50 Burpees"
          })
        ];
        
        await Promise.all(punishments);
      }
      
      // Update user's lastTaskGenerationDate
      await storage.updateUser(user.id, {
        lastTaskGenerationDate: new Date()
      });
      
      // Return the saved tasks
      res.json(savedTasks);
    } catch (error) {
      console.error("Error generating daily tasks:", error);
      res.status(500).json({ message: "Failed to generate daily AI tasks" });
    }
  });
  
  // Get a single AI-generated task
  app.get("/api/ai/suggest", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const difficulty = req.query.difficulty as "easy" | "medium" | "hard" | undefined;
      const isSpecialChallenge = req.query.special === "true";
      
      // Generate a task with the specified parameters
      const task = await generateTask(user, difficulty, isSpecialChallenge);
      
      // Don't save the task directly - just return it as a suggestion
      // The frontend will send it back via /api/tasks if the user accepts
      res.json(task);
    } catch (error) {
      console.error("Error getting task suggestion:", error);
      res.status(500).json({ message: "Failed to generate task suggestion" });
    }
  });
  
  // Get daily special challenge
  app.get("/api/ai/daily-challenge", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Look for today's special challenge
      const tasks = await storage.getActiveTasksByUserId(user.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysSpecialChallenge = tasks.find(task => {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime() && task.isSpecialChallenge;
      });
      
      if (todaysSpecialChallenge) {
        return res.json(todaysSpecialChallenge);
      }
      
      // If we don't have one yet, check if we should generate all daily tasks
      const shouldGenerate = shouldGenerateTasksToday(user.lastTaskGenerationDate);
      
      if (shouldGenerate) {
        // Redirect to the daily tasks endpoint to generate everything
        return res.redirect(307, "/api/ai/daily-tasks");
      }
      
      // If we're here, we should have tasks but no challenge for some reason
      // Generate just the special challenge
      const task = await generateTask(user, undefined, true);
      const savedTask = await storage.createTask(task);
      
      // Create punishment options for the task
      const punishments = [
        storage.createPunishment({
          taskId: savedTask.id,
          type: "xp",
          value: savedTask.xpReward.toString()
        }),
        storage.createPunishment({
          taskId: savedTask.id,
          type: "xpass",
          value: Math.floor(savedTask.xpReward / 3).toString()
        }),
        storage.createPunishment({
          taskId: savedTask.id,
          type: "physical",
          value: "40 Burpees"  // Special challenge always gets a harder punishment
        })
      ];
      
      await Promise.all(punishments);
      
      res.json(savedTask);
    } catch (error) {
      console.error("Error getting daily challenge:", error);
      res.status(500).json({ message: "Failed to get daily challenge" });
    }
  });

  return httpServer;
}
