import { useAirtable } from '@/hooks/useAirtable';
import { useMistralAI } from '@/hooks/useMistralAI';
import { Task } from '@shared/schema';
import { useSound } from '@/hooks/useSound';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DailyChallenge() {
  const { useDailyChallenge } = useAirtable();
  const { useGenerateDailyTasks } = useMistralAI();
  const { data: dailyChallenge, isLoading, isError } = useDailyChallenge();
  const generateDailyTasks = useGenerateDailyTasks();
  const { playSound } = useSound();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Ensure we have proper typing for the daily challenge
  const challenge = dailyChallenge as Task | undefined;
  
  const handleGenerateDailyTasks = () => {
    playSound('buttonClick');
    generateDailyTasks.mutate();
  };
  
  const handleExpandToggle = () => {
    playSound('buttonClick');
    setIsExpanded(!isExpanded);
  };
  
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-rajdhani font-semibold text-lg text-foreground">Daily Challenge</h3>
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <div className="glass-panel rounded-xl p-4 border-2 border-primary/20">
          <div className="flex items-start">
            <Skeleton className="w-12 h-12 rounded-lg mr-3" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError || !challenge) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-rajdhani font-semibold text-lg text-foreground">Daily Challenge</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGenerateDailyTasks}
            disabled={generateDailyTasks.isPending}
            className="text-xs text-primary"
          >
            {generateDailyTasks.isPending ? 'Generating...' : 'Generate Challenge'}
          </Button>
        </div>
        
        <div className="glass-panel rounded-xl p-6 border-2 border-primary/20 text-center">
          <h4 className="font-rajdhani font-bold text-base text-foreground mb-2">
            No Daily Challenge Available
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Generate today's special challenge to earn bonus XP and level up faster.
          </p>
          <Button 
            onClick={handleGenerateDailyTasks}
            disabled={generateDailyTasks.isPending}
            variant="default"
            size="sm"
          >
            {generateDailyTasks.isPending ? 'Generating...' : 'Generate Now'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-rajdhani font-semibold text-lg text-foreground">Daily Challenge</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
          Special Quest
        </Badge>
      </div>
      
      <div className="glass-panel rounded-xl p-4 border-2 border-primary/20">
        <div className="flex items-start mb-3">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          
          <div>
            <h4 className="font-rajdhani font-bold text-base text-foreground mb-1">
              {challenge.title}
            </h4>
            
            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-20'}`}>
              <p className="text-sm text-muted-foreground">
                {challenge.description}
              </p>
              
              {challenge.aiRecommendation && (
                <p className="text-xs text-primary mt-3 italic">
                  AI Tip: {challenge.aiRecommendation}
                </p>
              )}
              
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="font-normal">
                  XP: {challenge.xpReward}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                </Badge>
                {challenge.proofType && (
                  <Badge variant="outline" className="font-normal">
                    Proof: {challenge.proofType.charAt(0).toUpperCase() + challenge.proofType.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleExpandToggle}
              className="text-xs text-primary mt-2 flex items-center"
            >
              {isExpanded ? 'Show Less' : 'Show More'} 
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex items-center">
          <div className="h-1.5 bg-muted rounded-full flex-1 mr-2">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ 
                width: `${Math.min(100, (challenge.xpReward / 500) * 100)}%` 
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {challenge.xpReward} XP
          </span>
        </div>
      </div>
    </div>
  );
}