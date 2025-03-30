import { User, InsertTask } from "@shared/schema";

// Interface for AI-generated task
interface AITask {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  proofType: "photo" | "text";
  xpReward: number;
  aiRecommendation: string;
  failurePenalty: {
    type: "credits" | "xp";
    amount: number;
  };
  isSpecialChallenge?: boolean;
}

// Function to generate tasks by difficulty using Mistral AI
export async function generateTasksByDifficulty(
  user: User, 
  difficulty: "easy" | "medium" | "hard",
  count: number = 2
): Promise<AITask[]> {
  try {
    // Get API key from environment variables
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error("Missing Mistral API key");
      return getFallbackTasksByDifficulty(difficulty, count);
    }
    
    // Base URL for Mistral AI API
    const baseUrl = "https://api.mistral.ai/v1";
    
    // Set XP reward range based on difficulty
    let xpRange = "";
    switch (difficulty) {
      case "easy":
        xpRange = "50-100";
        break;
      case "medium":
        xpRange = "150-200";
        break;
      case "hard":
        xpRange = "250-350";
        break;
    }
    
    // Prepare prompt for task generation
    const prompt = `Generate ${count} ${difficulty} difficulty self-improvement tasks for a level ${user.level} user named ${user.displayName}. 
    For each task, provide:
    1. Title (short, compelling)
    2. Description (detailed instructions)
    3. Category (e.g., fitness, productivity, learning, mindfulness)
    4. Proof type needed (photo or text)
    5. XP reward (${xpRange})
    6. AI recommendation (tips for completing the task effectively)
    
    Format the response as a JSON object with a 'tasks' array containing task objects with fields: title, description, category, proofType, xpReward, aiRecommendation.
    Every task must have difficulty set to "${difficulty}".`;
    
    // Make API request to Mistral AI
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      console.error("Error from Mistral AI:", await response.text());
      return getFallbackTasksByDifficulty(difficulty, count);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const parsedContent = JSON.parse(content);
      const tasks = parsedContent.tasks || [];
      
      // Ensure all tasks have the correct difficulty
      return tasks.map((task: AITask) => ({
        ...task,
        difficulty
      }));
    } catch (error) {
      console.error("Error parsing Mistral AI response:", error);
      return getFallbackTasksByDifficulty(difficulty, count);
    }
  } catch (error) {
    console.error(`Error generating ${difficulty} tasks with Mistral AI:`, error);
    return getFallbackTasksByDifficulty(difficulty, count);
  }
}

// Generate a special daily challenge
export async function generateDailyChallenge(user: User): Promise<AITask> {
  try {
    // Get API key from environment variables
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error("Missing Mistral API key");
      return getDailyChallengeFallback();
    }
    
    // Base URL for Mistral AI API
    const baseUrl = "https://api.mistral.ai/v1";
    
    // Prepare prompt for daily challenge generation
    const prompt = `Generate 1 special daily challenge for a level ${user.level} user named ${user.displayName}. 
    This should be a unique, engaging task that stands out from regular tasks.
    
    For the challenge, provide:
    1. Title (creative and motivating)
    2. Description (detailed instructions with a sense of adventure)
    3. Difficulty (choose from easy, medium, or hard based on complexity)
    4. Category (e.g., fitness, productivity, learning, mindfulness, social)
    5. Proof type needed (photo or text)
    6. XP reward (100-400 depending on difficulty)
    7. AI recommendation (tips for completing the challenge effectively)
    
    Format the response as a JSON object with a 'challenge' object containing fields: title, description, difficulty, category, proofType, xpReward, aiRecommendation.`;
    
    // Make API request to Mistral AI
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      console.error("Error from Mistral AI:", await response.text());
      return getDailyChallengeFallback();
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const parsedContent = JSON.parse(content);
      const challenge = parsedContent.challenge || {};
      
      return {
        ...challenge,
        isSpecialChallenge: true
      };
    } catch (error) {
      console.error("Error parsing Mistral AI daily challenge response:", error);
      return getDailyChallengeFallback();
    }
  } catch (error) {
    console.error("Error generating daily challenge with Mistral AI:", error);
    return getDailyChallengeFallback();
  }
}

// Function to generate all tasks for a user using Mistral AI
export async function generateAllDailyTasks(user: User): Promise<AITask[]> {
  try {
    // Generate 2 tasks per difficulty level
    const easyTasks = await generateTasksByDifficulty(user, "easy", 2);
    const mediumTasks = await generateTasksByDifficulty(user, "medium", 2);
    const hardTasks = await generateTasksByDifficulty(user, "hard", 2);
    
    // Generate 1 special daily challenge
    const dailyChallenge = await generateDailyChallenge(user);
    
    // Combine all tasks
    return [...easyTasks, ...mediumTasks, ...hardTasks, dailyChallenge];
  } catch (error) {
    console.error("Error generating all daily tasks:", error);
    return getFallbackTasks();
  }
}

// Get fallback tasks by difficulty in case of API failure
function getFallbackTasksByDifficulty(
  difficulty: "easy" | "medium" | "hard", 
  count: number
): AITask[] {
  const allFallbackTasks = getFallbackTasks();
  const filteredTasks = allFallbackTasks.filter(task => task.difficulty === difficulty);
  
  // If we don't have enough fallback tasks of the requested difficulty,
  // return whatever we have, or empty array
  return filteredTasks.slice(0, count);
}

// Get fallback daily challenge in case of API failure
function getDailyChallengeFallback(): AITask {
  return {
    title: "Master Your Day Challenge",
    description: "Plan your entire day in detail, including time blocks for your most important tasks, breaks, exercise, and relaxation. Execute the plan and document your progress throughout the day.",
    difficulty: "medium",
    category: "Productivity",
    proofType: "text",
    xpReward: 250,
    aiRecommendation: "Start by identifying your 3 highest priority tasks. Schedule them during your peak energy hours. Build in buffer time between activities and track your progress hourly.",
    failurePenalty: {
      type: "credits",
      amount: 25
    },
    isSpecialChallenge: true
  };
}

// Get fallback tasks in case of API failure
function getFallbackTasks(): AITask[] {
  return [
    // Easy tasks
    {
      title: "Read 10 Pages",
      description: "Read 10 pages of your current book and make mental notes of key concepts. Consistent reading improves focus, vocabulary, and knowledge retention.",
      difficulty: "easy",
      category: "Learning",
      proofType: "text",
      xpReward: 70,
      aiRecommendation: "Find a quiet place without distractions. Take brief notes after each page to improve retention. Try to read at the same time each day to build a habit.",
      failurePenalty: {
        type: "credits",
        amount: 10
      }
    },
    {
      title: "5-Minute Meditation",
      description: "Spend 5 minutes in silent meditation, focusing on your breath. This practice reduces stress and improves mental clarity.",
      difficulty: "easy",
      category: "Mindfulness",
      proofType: "text",
      xpReward: 50,
      aiRecommendation: "Find a quiet spot, sit comfortably, and set a timer. Focus on your breathing, and when your mind wanders, gently bring your attention back to your breath.",
      failurePenalty: {
        type: "credits",
        amount: 5
      }
    },
    
    // Medium tasks
    {
      title: "Complete 30 min Study Session",
      description: "Focus on your most important subject material without distractions. Use the Pomodoro technique (25 min work, 5 min break) for maximum effectiveness.",
      difficulty: "medium",
      category: "Productivity",
      proofType: "text",
      xpReward: 175,
      aiRecommendation: "Turn off all notifications during your study session. Set a clear goal for what you want to accomplish. Review what you learned at the end of the session.",
      failurePenalty: {
        type: "credits",
        amount: 20
      }
    },
    {
      title: "Healthy Meal Prep",
      description: "Prepare a nutritious meal with balanced macronutrients (protein, carbs, and healthy fats). Document your ingredients and cooking process.",
      difficulty: "medium",
      category: "Nutrition",
      proofType: "photo",
      xpReward: 180,
      aiRecommendation: "Include a palm-sized portion of protein, a fist-sized portion of complex carbs, and plenty of colorful vegetables. Use herbs and spices instead of excess salt for flavor.",
      failurePenalty: {
        type: "credits",
        amount: 25
      }
    },
    
    // Hard tasks
    {
      title: "Morning Workout Challenge",
      description: "Complete 20 pushups, 30 squats, and 40 jumping jacks before breakfast. This workout will boost your energy levels for the day and improve your overall fitness.",
      difficulty: "hard",
      category: "Fitness",
      proofType: "photo",
      xpReward: 280,
      aiRecommendation: "For best results, perform this workout within 30 minutes of waking up to maximize metabolic benefits. Maintain proper form for all exercises to prevent injury and ensure maximum effectiveness.",
      failurePenalty: {
        type: "credits",
        amount: 40
      }
    },
    {
      title: "Digital Detox",
      description: "Go 4 hours without using any digital devices (except for essential work). Use this time for deep work, reading, exercise, or connecting with people in person.",
      difficulty: "hard",
      category: "Wellbeing",
      proofType: "text",
      xpReward: 300,
      aiRecommendation: "Plan your digital-free hours in advance. Notify contacts that you'll be unavailable. Keep a journal nearby to note any insights or ideas that come up during your detox.",
      failurePenalty: {
        type: "credits",
        amount: 45
      }
    }
  ];
}

// Check if tasks should be generated today
export function shouldGenerateTasksToday(lastGeneratedDate: Date | null): boolean {
  if (!lastGeneratedDate) {
    return true;
  }
  
  const today = new Date();
  const lastGenerated = new Date(lastGeneratedDate);
  
  // Check if the date components (year, month, day) are different
  return (
    today.getFullYear() !== lastGenerated.getFullYear() ||
    today.getMonth() !== lastGenerated.getMonth() ||
    today.getDate() !== lastGenerated.getDate()
  );
}

// Generate a single task from Mistral AI with expiration date
export async function generateTask(
  user: User, 
  difficulty?: "easy" | "medium" | "hard", 
  isSpecialChallenge: boolean = false
): Promise<InsertTask> {
  try {
    // Get API key from environment variables
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error("Missing Mistral API key");
      throw new Error("Missing API key");
    }
    
    // Base URL for Mistral AI API
    const baseUrl = "https://api.mistral.ai/v1";
    
    // Set difficulty if not provided
    if (!difficulty) {
      const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"];
      difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    }
    
    // Set XP reward range based on difficulty
    let xpRange = "";
    let creditsPenaltyRange = "";
    switch (difficulty) {
      case "easy":
        xpRange = "50-100";
        creditsPenaltyRange = "5-15";
        break;
      case "medium":
        xpRange = "150-250";
        creditsPenaltyRange = "20-30";
        break;
      case "hard":
        xpRange = "300-500";
        creditsPenaltyRange = "40-60";
        break;
    }
    
    // Prepare prompt for task generation
    const prompt = `Generate a single, concrete physical or mental challenge task for a level ${user.level} user named ${user.displayName}.

Task requirements:
1. It must be a specific, accomplishable activity (NOT a habit or multi-day task)
2. It should be physically or mentally challenging and worth being punished for failing
3. It must have clear completion criteria
4. It must be something that can be completed in a single session
5. Prefer tasks that require real-world action rather than digital activities

For example, DO generate tasks like:
- "Run 5km and track your time"
- "Complete 100 pushups in sets with minimal rest"
- "Meditate for 30 consecutive minutes without distractions"
- "Write a 1000-word short story in a single sitting"
- "Solve 20 difficult math problems"

DON'T generate tasks like:
- "Wake up early every day for a week"
- "Drink water throughout the day"
- "Plan your activities for the day"
- "Maintain a habit of journaling"

For the task, provide:
1. Title (short, compelling)
2. Description (detailed instructions with specific goals/metrics)
3. Difficulty: ${difficulty}
4. Category (e.g., fitness, productivity, learning, mindfulness)
5. Proof type needed (photo or text)
6. XP reward (${xpRange})
7. AI recommendation (specific tips for completing the task successfully)
8. Failure penalty (always credits payment for ${difficulty} tasks, amount: ${creditsPenaltyRange})

Format the response as a JSON object with fields: title, description, difficulty, category, proofType, xpReward, aiRecommendation, failurePenalty (object with type: "credits" and amount: number).`;
    
    // Make API request to Mistral AI
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      console.error("Error from Mistral AI:", await response.text());
      throw new Error("API request failed");
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const task = JSON.parse(content);
    
    // Ensure the task has the correct difficulty
    task.difficulty = difficulty;
    
    // Set isSpecialChallenge if requested
    if (isSpecialChallenge) {
      task.isSpecialChallenge = true;
    }
    
    // Set expiration date (24 hours from now by default)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    return {
      userId: user.id,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      xpReward: task.xpReward,
      createdBy: "ai",
      proofType: task.proofType,
      expiresAt,
      category: task.category,
      aiRecommendation: task.aiRecommendation,
      failurePenalty: task.failurePenalty,
      isSpecialChallenge: isSpecialChallenge
    };
  } catch (error) {
    console.error("Error generating task:", error);
    
    // Fallback task if API fails
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const fallbackTask = {
      userId: user.id,
      title: difficulty === "hard" ? "Complete 100 Push-ups" : 
             difficulty === "medium" ? "Read 30 Pages of a Book" : 
             "10-Minute Focused Meditation",
      description: difficulty === "hard" ? "Complete 100 push-ups in as few sets as possible. Rest only when necessary. Track each set and total time to completion." : 
                  difficulty === "medium" ? "Select a challenging book and read 30 pages in a single sitting. Take notes on key concepts or interesting passages." : 
                  "Meditate for 10 minutes without distractions. Focus on your breath and practice bringing your mind back when it wanders.",
      difficulty: difficulty || "medium",
      xpReward: difficulty === "hard" ? 300 : difficulty === "medium" ? 150 : 50,
      createdBy: "ai",
      proofType: difficulty === "hard" ? "photo" : "text",
      expiresAt,
      category: difficulty === "hard" ? "Fitness" : difficulty === "medium" ? "Learning" : "Mindfulness",
      aiRecommendation: difficulty === "hard" ? "Divide the 100 push-ups into manageable sets based on your fitness level. If you can do 20 at once, try 5 sets of 20 with minimal rest between sets." : 
                        difficulty === "medium" ? "Choose a quiet environment without distractions. Put your phone on silent and set a timer for your reading session." : 
                        "Find a quiet place, sit comfortably, and set a timer. Focus on your breathing, and when your mind wanders, gently bring your attention back.",
      failurePenalty: {
        type: "credits",
        amount: difficulty === "hard" ? 40 : difficulty === "medium" ? 20 : 10
      },
      isSpecialChallenge
    };
    
    return fallbackTask;
  }
}

// Generate all daily tasks for a user (2 tasks per difficulty level + 1 special challenge)
export async function generateAllUserDailyTasks(user: User): Promise<InsertTask[]> {
  try {
    // Get all AI-generated tasks
    const allTasks = await generateAllDailyTasks(user);
    
    // Convert AITask[] to InsertTask[]
    return allTasks.map(task => {
      // Set expiration date (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      return {
        userId: user.id,
        title: task.title,
        description: task.description,
        difficulty: task.difficulty,
        xpReward: task.xpReward,
        createdBy: "ai",
        proofType: task.proofType,
        expiresAt,
        category: task.category,
        aiRecommendation: task.aiRecommendation,
        isSpecialChallenge: !!task.isSpecialChallenge
      };
    });
  } catch (error) {
    console.error("Error generating all user daily tasks:", error);
    
    // Generate a single fallback task if everything fails
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    return [{
      userId: user.id,
      title: "Daily Reading",
      description: "Read at least 10 pages of any book of your choice.",
      difficulty: "easy",
      xpReward: 50,
      createdBy: "ai",
      proofType: "text",
      expiresAt,
      category: "Learning",
      aiRecommendation: "Choose a book you're genuinely interested in to make this task more enjoyable."
    }];
  }
}
