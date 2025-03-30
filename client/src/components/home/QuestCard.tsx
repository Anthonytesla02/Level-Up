import { Task } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface QuestCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function QuestCard({ task, onClick }: QuestCardProps) {
  // Calculate time remaining
  const timeRemaining = () => {
    try {
      return formatDistanceToNow(new Date(task.expiresAt), { addSuffix: false });
    } catch (err) {
      return "Unknown time";
    }
  };

  // Get difficulty class
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
        return 'difficulty-hard';
      default:
        return 'difficulty-medium';
    }
  };

  return (
    <div 
      className="quest-card rounded-xl p-4 relative overflow-hidden cursor-pointer"
      onClick={() => onClick(task)}
    >
      <div 
        className={`absolute top-0 right-0 px-2 py-1 ${getDifficultyClass(task.difficulty)} text-xs rounded-bl-lg font-medium`}
      >
        {task.difficulty.toUpperCase()}
      </div>
      
      <h4 className="font-rajdhani font-semibold text-base pr-16 mb-2 text-foreground">
        {task.title}
      </h4>
      
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {task.description}
      </p>
      
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-secondary mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-muted-foreground">
            Expires in {timeRemaining()}
          </span>
        </div>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-secondary mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="text-primary font-orbitron">
            +{task.xpReward} XP
          </span>
        </div>
      </div>
    </div>
  );
}
