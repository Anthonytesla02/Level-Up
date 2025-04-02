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
    
    Challenge requirements:
    1. It must be highly original and creative - avoid common activities like stair climbing, hiking, or planks
    2. It should combine multiple skills or domains (e.g., physical + creative, mental + social)
    3. It must be something that can be completed in a single day but feels special and exciting
    4. The task should feel like an adventure or a special mission, not just a routine activity
    5. It should push the user outside their comfort zone in an interesting way
    
    For example, DO create challenges like:
    - "Create and complete a neighborhood photo scavenger hunt with 10 specific items to find and photograph"
    - "Record a short video teaching someone else a skill you're good at"
    - "Prepare a dish from a cuisine you've never cooked before and document the process"
    - "Create a handmade gift for someone and deliver it in person"
    
    DON'T create challenges like:
    - "Climb stairs" or "Take a hike" or "Do planks" (these are overused)
    - Simple activities that don't feel special or challenging
    - Multi-day habits or routine activities
    
    For the challenge, provide:
    1. Title (creative and motivating)
    2. Description (detailed instructions with a sense of adventure)
    3. Difficulty (choose from easy, medium, or hard based on complexity)
    4. Category (e.g., fitness, productivity, learning, mindfulness, social, creative)
    5. Proof type needed (photo or text)
    6. XP reward (100-400 depending on difficulty)
    7. AI recommendation (specific tips for completing the challenge successfully)
    8. Failure penalty (an object with type: "credits" and amount: 25-50)
    
    Format the response as a JSON object with a 'challenge' object containing fields: title, description, difficulty, category, proofType, xpReward, aiRecommendation, failurePenalty.`;
    
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
  // Create varied daily challenge options
  const dailyChallenges: Array<{
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
    }
  }> = [
    {
      title: "Photo Storytelling Challenge",
      description: "Create a visual story by taking 7 photos throughout your day that tell a cohesive narrative. Each photo should represent a chapter in your day's story.",
      difficulty: "medium",
      category: "Creative",
      proofType: "photo",
      xpReward: 280,
      aiRecommendation: "Think about your day as a narrative arc with a beginning, middle, and end. Look for moments of contrast, emotion, or visual interest to capture.",
      failurePenalty: {
        type: "credits",
        amount: 30
      }
    },
    {
      title: "Cook From Another Culture",
      description: "Research and prepare a dish from a cuisine you've never cooked before. Find an authentic recipe, gather the ingredients, and document your cooking process.",
      difficulty: "medium",
      category: "Learning",
      proofType: "photo",
      xpReward: 250,
      aiRecommendation: "Start by researching the cultural significance of the dish. Watch videos on proper preparation techniques before starting, and take photos of both the process and final result.",
      failurePenalty: {
        type: "credits",
        amount: 25
      }
    },
    {
      title: "Random Act of Kindness Marathon",
      description: "Perform 5 different random acts of kindness in a single day. They must be varied (not all the same type) and impact different people or groups.",
      difficulty: "medium",
      category: "Social",
      proofType: "text",
      xpReward: 300,
      aiRecommendation: "Plan your 5 acts in advance. Consider both strangers and people you know. Acts can range from small (paying for someone's coffee) to more involved (helping someone with a task).",
      failurePenalty: {
        type: "credits",
        amount: 35
      }
    },
    {
      title: "Skill-Teaching Video Challenge",
      description: "Create a 2-3 minute instructional video teaching someone else a skill you're good at. The video should be clear, engaging, and actually helpful to a beginner.",
      difficulty: "medium",
      category: "Learning",
      proofType: "text",
      xpReward: 270,
      aiRecommendation: "Choose a skill you know well but can break down simply. Plan your key points before filming, use good lighting, and practice your explanation a few times before recording.",
      failurePenalty: {
        type: "credits",
        amount: 30
      }
    }
  ];
  
  // Select a random daily challenge
  const selectedChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
  return {
    ...selectedChallenge,
    // Already have correct types in the array definition
    isSpecialChallenge: true
  };
}

// Get fallback tasks in case of API failure
function getFallbackTasks(): AITask[] {
  return [
    // Easy tasks
    {
      title: "Nature Sketch Challenge",
      description: "Go outside and sketch something from nature that catches your eye - a plant, cloud formation, or landscape. No artistic skill required - focus on observation.",
      difficulty: "easy",
      category: "Creative",
      proofType: "photo",
      xpReward: 80,
      aiRecommendation: "Don't worry about making it perfect. The goal is to observe closely and translate what you see to paper. Take a photo of your sketch as proof.",
      failurePenalty: {
        type: "credits",
        amount: 10
      }
    },
    {
      title: "5-Minute Hand-Eye Coordination Drill",
      description: "Practice juggling with 2 small objects for 5 minutes. If you drop them, simply pick up and continue until the time is complete.",
      difficulty: "easy",
      category: "Skill",
      proofType: "text",
      xpReward: 60,
      aiRecommendation: "Start with soft objects like rolled-up socks. Stand near a bed or couch so dropped items don't roll away. Focus on a consistent throwing height and rhythm.",
      failurePenalty: {
        type: "credits",
        amount: 8
      }
    },
    {
      title: "Memory Palace Exercise",
      description: "Create a memory palace by associating 10 items you need to remember with specific locations in your home. Walk through your home mentally to recall them in order.",
      difficulty: "easy",
      category: "Mental",
      proofType: "text",
      xpReward: 70,
      aiRecommendation: "Make the associations vivid and unusual - the stranger the better for memory retention. Test yourself by writing down all items from memory after an hour.",
      failurePenalty: {
        type: "credits",
        amount: 12
      }
    },
    
    // Medium tasks
    {
      title: "Shadow Boxing Routine",
      description: "Complete 15 minutes of shadow boxing, focusing on proper form, footwork, and combinations. Include basic punches, defensive movements, and at least 5 different combinations.",
      difficulty: "medium",
      category: "Fitness",
      proofType: "text",
      xpReward: 200,
      aiRecommendation: "Start with a 2-minute warm-up. Keep your hands up and maintain a proper stance. Focus on controlled movements rather than speed. Describe your routine and how your body felt afterward.",
      failurePenalty: {
        type: "credits",
        amount: 22
      }
    },
    {
      title: "Foreign Language Immersion",
      description: "Watch a 30-minute show or video in a language you're learning without subtitles. Write down 10 new words or phrases you heard and their meanings.",
      difficulty: "medium",
      category: "Learning",
      proofType: "text",
      xpReward: 180,
      aiRecommendation: "Choose content slightly above your current level. Watch in 10-minute segments, noting words to look up after each segment. Try to guess meanings from context before checking.",
      failurePenalty: {
        type: "credits",
        amount: 25
      }
    },
    {
      title: "Handwritten Letter",
      description: "Write a handwritten letter (minimum 1 page) to someone important in your life. Be thoughtful, specific, and express gratitude for their impact on you.",
      difficulty: "medium",
      category: "Social",
      proofType: "photo",
      xpReward: 160,
      aiRecommendation: "Find a quiet space and reflect before writing. Include specific memories and details about how they've influenced you. Take a photo of the letter (content can be private).",
      failurePenalty: {
        type: "credits",
        amount: 20
      }
    },
    
    // Hard tasks
    {
      title: "Master 5 Magic Tricks",
      description: "Learn and practice 5 basic magic or card tricks until you can perform them smoothly. Prepare a brief performance for someone.",
      difficulty: "hard",
      category: "Skill",
      proofType: "text",
      xpReward: 320,
      aiRecommendation: "Start with simple tricks that require minimal props. Practice in front of a mirror until movements feel natural. Focus on the presentation and storytelling aspects of magic.",
      failurePenalty: {
        type: "credits",
        amount: 40
      }
    },
    {
      title: "Cold Shower Challenge",
      description: "Take a completely cold shower for at least 3 minutes. Focus on controlled breathing and staying calm despite the discomfort.",
      difficulty: "hard",
      category: "Willpower",
      proofType: "text",
      xpReward: 280,
      aiRecommendation: "Start by taking a few deep breaths before entering. Focus on breathing slowly throughout. Begin with your limbs before exposing your torso and head to the cold water.",
      failurePenalty: {
        type: "credits",
        amount: 35
      }
    },
    {
      title: "City Explorer Challenge",
      description: "Visit 5 locations in your city or area that you've never been to before. Take a photo at each location and write a brief reflection on what you discovered.",
      difficulty: "hard",
      category: "Adventure",
      proofType: "photo",
      xpReward: 350,
      aiRecommendation: "Research interesting spots beforehand or ask locals for recommendations. Look for hidden gems like small parks, independent shops, viewpoints, or historical markers.",
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
6. The task MUST be original and highly diverse - DO NOT create common repetitive tasks like stair climbing, hiking, or planks
7. Focus on creative, unique activities that would be interesting to try once

For example, DO generate tasks like:
- "Create a 30-minute percussion rhythm using household items"
- "Draw a self-portrait with your non-dominant hand"
- "Learn and perform a 2-minute dance routine from a video"
- "Create an origami masterpiece following a tutorial"
- "Complete 50 jump squats while reciting the lyrics to your favorite song"
- "Solve a complex Sudoku puzzle in under 30 minutes"
- "Make a healthy meal from 5 ingredients you've never cooked with before"

DON'T generate tasks like:
- "Climb stairs" or "Take a hike" or "Do planks" (these are overused)
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
    
    // Create more varied fallback tasks with a random selection based on difficulty
    const hardTasks = [
      {
        title: "30-Minute Freestyle Dance Session",
        description: "Dance freestyle to your favorite music for 30 continuous minutes. Focus on expressing yourself and maintaining high energy throughout.",
        category: "Fitness",
        proofType: "photo",
        aiRecommendation: "Pick upbeat music you love, clear some space in your room, and just let yourself move without judgment. Take a photo of your setup or a sweaty selfie after completion."
      },
      {
        title: "Creative Writing Challenge",
        description: "Write a 1000-word short story in a single sitting. The story must include these elements: a lost item, a difficult decision, and an unexpected encounter.",
        category: "Creativity",
        proofType: "text",
        aiRecommendation: "Set a timer and focus completely on the story. Don't edit while writing—just get your ideas down and review afterward. Share a brief excerpt as proof."
      },
      {
        title: "Advanced Yoga Flow",
        description: "Complete a challenging 45-minute yoga flow that includes at least 5 balance poses. Hold each pose for at least 30 seconds.",
        category: "Fitness",
        proofType: "photo",
        aiRecommendation: "Find a quiet space, use a yoga mat if available, and focus on your breathing throughout. Take a photo of yourself in one of the more challenging poses."
      }
    ];
    
    const mediumTasks = [
      {
        title: "Learn a New Song on Any Instrument",
        description: "Learn to play a new song on any musical instrument you have access to. Practice until you can play it through with minimal mistakes.",
        category: "Learning",
        proofType: "text",
        aiRecommendation: "Choose a song that challenges you but isn't beyond your skill level. Break it down into sections and practice each part separately before putting it all together."
      },
      {
        title: "Declutter and Organize One Space",
        description: "Select one cluttered area in your home (desk, closet, drawer) and completely reorganize it. Remove unnecessary items and create a functional system.",
        category: "Productivity",
        proofType: "photo",
        aiRecommendation: "Take a before and after photo. Start by removing everything, sorting into keep/donate/trash piles, and then organize what you're keeping."
      },
      {
        title: "Create Digital Art",
        description: "Using any digital tool available to you, create a piece of digital art that represents your current mood or mindset.",
        category: "Creativity",
        proofType: "photo",
        aiRecommendation: "Don't worry about being perfect - focus on expressing yourself. Try using colors that reflect your emotions and experiment with different digital brushes or tools."
      }
    ];
    
    const easyTasks = [
      {
        title: "Mindful Nature Observation",
        description: "Spend 20 minutes outside observing nature. Focus on details you normally overlook - patterns in leaves, cloud formations, insect movements, etc.",
        category: "Mindfulness",
        proofType: "text",
        aiRecommendation: "Leave your phone behind or on silent mode. Take mental notes of what you observe and write about your observations afterward as proof."
      },
      {
        title: "Random Act of Kindness",
        description: "Perform a thoughtful, unexpected act of kindness for someone in your life. This could be making something, helping with a task, or just a meaningful gesture.",
        category: "Social",
        proofType: "text",
        aiRecommendation: "Consider what would be truly meaningful to the recipient. The impact is more important than the size of the gesture."
      },
      {
        title: "Learn 10 New Words",
        description: "Research and learn 10 new words in your native language or a language you're studying. Create a sentence using each word.",
        category: "Learning",
        proofType: "text",
        aiRecommendation: "Choose words that you might actually use in conversation. Creating sentences helps cement the meanings in your memory."
      }
    ];
    
    // Select a random task based on difficulty
    const taskOptions = difficulty === "hard" ? hardTasks : 
                       difficulty === "medium" ? mediumTasks : 
                       easyTasks;
    const randomTask = taskOptions[Math.floor(Math.random() * taskOptions.length)];
    
    const fallbackTask = {
      userId: user.id,
      title: randomTask.title,
      description: randomTask.description,
      difficulty: difficulty || "medium",
      xpReward: difficulty === "hard" ? 300 : difficulty === "medium" ? 150 : 50,
      createdBy: "ai",
      proofType: randomTask.proofType,
      expiresAt,
      category: randomTask.category,
      aiRecommendation: randomTask.aiRecommendation,
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
