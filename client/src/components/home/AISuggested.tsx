import { useState } from 'react';
import { useAirtable } from '@/hooks/useAirtable';
import { useMistralAI } from '@/hooks/useMistralAI';
import { Task } from '@shared/schema';
import { useSound } from '@/hooks/useSound';
import { Skeleton } from '@/components/ui/skeleton';

export function AISuggested() {
  const { useAcceptAiTask, useActiveTasks } = useAirtable();
  const { useGenerateDailyTasks } = useMistralAI();
  const { data: activeTasks = [] as Task[] } = useActiveTasks();
  
  // Set frequencies for difficulty levels (15% Easy, 35% Medium, 50% Hard)
  const getWeightedRandomDifficulty = () => {
    const rand = Math.random() * 100;
    if (rand < 15) return 'easy' as const;
    if (rand < 50) return 'medium' as const; // 15 + 35 = 50
    return 'hard' as const;
  };
  
  // Use weighted random difficulty
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    getWeightedRandomDifficulty()
  );
  
  const { data: suggestion, isLoading, refetch } = useAirtable().useAiSuggestions(difficulty);
  const acceptTask = useAcceptAiTask();
  const generateDailyTasks = useGenerateDailyTasks();
  const { playSound } = useSound();
  
  const handleAcceptQuest = (task: Task) => {
    playSound('buttonClick');
    
    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    acceptTask.mutate({
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      xpReward: task.xpReward,
      proofType: task.proofType,
      expiresAt,
      category: task.category,
      aiRecommendation: task.aiRecommendation,
      isSpecialChallenge: task.isSpecialChallenge || false
    });
  };
  
  const handleSkip = () => {
    playSound('buttonClick');
    
    // Change to a weighted random difficulty
    setDifficulty(getWeightedRandomDifficulty());
    
    // Refetch with the new difficulty
    refetch();
  };
  
  const handleGenerateDailyTasks = () => {
    playSound('buttonClick');
    
    // Only allow generating if user has fewer than 3 active tasks
    if ((activeTasks as Task[]).length < 3) {
      generateDailyTasks.mutate();
    }
  };
  
  // Check if the user has too many active tasks
  const hasTooManyActiveTasks = (activeTasks as Task[]).length >= 3;
  
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-rajdhani font-semibold text-lg text-foreground">AI Suggested</h3>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-start mb-4">
            <Skeleton className="w-9 h-9 rounded-lg mr-3" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!suggestion) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-rajdhani font-semibold text-lg text-foreground">AI Tasks</h3>
          <button 
            className={`text-xs ${hasTooManyActiveTasks ? 'text-gray-500' : 'text-primary'}`}
            onClick={handleGenerateDailyTasks}
            disabled={generateDailyTasks.isPending || hasTooManyActiveTasks}
            title={hasTooManyActiveTasks ? "Complete some active quests before generating new ones" : ""}
          >
            {generateDailyTasks.isPending ? 'Generating...' : 
             hasTooManyActiveTasks ? 'Too Many Active Quests' : 'Generate Daily Tasks'}
          </button>
        </div>
        
        <div className="glass-panel rounded-xl p-4 text-center">
          {hasTooManyActiveTasks ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You have {(activeTasks as Task[]).length} active quests. Complete some quests before generating new ones.
              </p>
              <p className="text-xs text-primary">
                AI recommends focusing on one task at a time for better results
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No AI suggestions available. Try generating daily tasks or check back later.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-rajdhani font-semibold text-lg text-foreground">AI Suggested</h3>
        <div className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
          {difficulty.toUpperCase()}
        </div>
      </div>
      
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-start mb-4">
          <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-secondary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          
          <div>
            <h4 className="font-rajdhani font-semibold text-sm text-foreground mb-1">
              {suggestion.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              {suggestion.description}
            </p>
            
            {suggestion.aiRecommendation && (
              <p className="text-xs text-primary mt-2 italic">
                AI: {suggestion.aiRecommendation}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button 
            className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground"
            onClick={handleSkip}
            disabled={acceptTask.isPending}
          >
            Skip
          </button>
          
          <button 
            className="bg-primary rounded-lg px-4 py-2 text-sm text-primary-foreground"
            onClick={() => handleAcceptQuest(suggestion as Task)}
            disabled={acceptTask.isPending}
          >
            {acceptTask.isPending ? 'Accepting...' : 'Accept Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}
