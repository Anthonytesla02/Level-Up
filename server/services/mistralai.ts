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
}

// Function to generate tasks using Mistral AI
export async function generateTasksWithMistralAI(user: User): Promise<AITask[]> {
  try {
    // Get API key from environment variables
    const apiKey = process.env.MISTRAL_API_KEY || "default_key";
    
    // Base URL for Mistral AI API
    const baseUrl = "https://api.mistral.ai/v1";
    
    // Prepare prompt for task generation
    const prompt = `Generate 3 self-improvement tasks for a ${user.level} level user named ${user.displayName}. 
    For each task, provide:
    1. Title (short, compelling)
    2. Description (detailed instructions)
    3. Difficulty (easy, medium, or hard)
    4. Category (e.g., fitness, productivity, learning)
    5. Proof type needed (photo or text)
    6. XP reward (50-100 for easy, 150-200 for medium, 250-350 for hard)
    7. AI recommendation (tips for completing the task effectively)
    
    Format the response as JSON array with objects containing fields: title, description, difficulty, category, proofType, xpReward, aiRecommendation.`;
    
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
      return getFallbackTasks();
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const parsedContent = JSON.parse(content);
      return parsedContent.tasks || [];
    } catch (error) {
      console.error("Error parsing Mistral AI response:", error);
      return getFallbackTasks();
    }
  } catch (error) {
    console.error("Error generating tasks with Mistral AI:", error);
    return getFallbackTasks();
  }
}

// Get fallback tasks in case of API failure
function getFallbackTasks(): AITask[] {
  return [
    {
      title: "Morning Workout Challenge",
      description: "Complete 20 pushups, 30 squats, and 40 jumping jacks before breakfast. This workout will boost your energy levels for the day and improve your overall fitness.",
      difficulty: "hard",
      category: "Fitness",
      proofType: "photo",
      xpReward: 280,
      aiRecommendation: "For best results, perform this workout within 30 minutes of waking up to maximize metabolic benefits. Maintain proper form for all exercises to prevent injury and ensure maximum effectiveness."
    },
    {
      title: "Read 10 Pages",
      description: "Read 10 pages of your current book and make mental notes of key concepts. Consistent reading improves focus, vocabulary, and knowledge retention.",
      difficulty: "easy",
      category: "Learning",
      proofType: "text",
      xpReward: 50,
      aiRecommendation: "Find a quiet place without distractions. Take brief notes after each page to improve retention. Try to read at the same time each day to build a habit."
    },
    {
      title: "Complete 30 min Study Session",
      description: "Focus on your most important subject material without distractions. Use the Pomodoro technique (25 min work, 5 min break) for maximum effectiveness.",
      difficulty: "medium",
      category: "Productivity",
      proofType: "text",
      xpReward: 150,
      aiRecommendation: "Turn off all notifications during your study session. Set a clear goal for what you want to accomplish. Review what you learned at the end of the session."
    }
  ];
}

// Generate task from Mistral AI with expiration date
export async function generateTask(user: User): Promise<InsertTask> {
  const aiTasks = await generateTasksWithMistralAI(user);
  
  // Choose a random task from the generated ones
  const task = aiTasks[Math.floor(Math.random() * aiTasks.length)];
  
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
    aiRecommendation: task.aiRecommendation
  };
}
