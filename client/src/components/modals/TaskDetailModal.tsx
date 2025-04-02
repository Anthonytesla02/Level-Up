import { Task } from '@shared/schema';
import { useAirtable } from '@/hooks/useAirtable';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onAccept?: (task: Task) => void;
  onComplete?: () => void;
}

export function TaskDetailModal({ task, onClose, onAccept, onComplete }: TaskDetailModalProps) {
  const { useCompleteTask } = useAirtable();
  const completeTask = useCompleteTask();
  const { playSound } = useSound();
  const { toast } = useToast();
  
  const difficultyColor = task.difficulty === 'easy' 
    ? 'text-[#22C55E]' 
    : task.difficulty === 'medium' 
      ? 'text-[#F59E0B]' 
      : 'text-[#EF4444]';

  const difficultyBgColor = task.difficulty === 'easy' 
    ? 'bg-[#22C55E]/10 border-[#22C55E]/30' 
    : task.difficulty === 'medium' 
      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' 
      : 'bg-[#EF4444]/10 border-[#EF4444]/30';
      
  const handleAccept = () => {
    if (onAccept) {
      playSound('buttonClick');
      onAccept(task);
      onClose();
    }
  };
  
  const handleCompleteTask = () => {
    playSound('buttonClick');
    
    // If we have an external completion handler, use it
    if (onComplete) {
      onComplete();
    } else {
      // Otherwise use the default handler
      completeTask.mutate({ 
        taskId: task.id,
        proof: "Completed via button" 
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/90">
      <div className="glass-panel rounded-xl p-6 max-w-sm w-full border border-primary/30 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-background z-10 pb-2">
          <h3 className="font-rajdhani font-bold text-xl text-foreground">Quest Details</h3>
          <button 
            className="text-muted-foreground bg-muted rounded-full p-1 hover:bg-primary/10" 
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <div className={`text-xs px-3 py-1 rounded-full ${difficultyBgColor} ${difficultyColor} font-medium border`}>
              {task.difficulty.toUpperCase()}
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
              {task.xpReward} XP
            </div>
            {task.isSpecialChallenge && (
              <div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                Special
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold">{task.title}</h2>
          
          <div className="space-y-3">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-primary">Description</h4>
              <p className="text-sm text-foreground">{task.description}</p>
            </div>
            
            {task.aiRecommendation && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="text-sm font-medium mb-2 text-primary">AI Recommendation</h4>
                <p className="text-sm text-foreground italic">{task.aiRecommendation}</p>
              </div>
            )}
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-secondary">Quest Details</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Proof Required</p>
                  <p className="font-medium">{task.proofType === 'photo' ? 'Photo' : 'Text'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{task.category || 'General'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">{new Date(task.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Show different buttons based on whether this is an active task or an AI suggestion */}
        <div className="pt-4 border-t border-border">
          {onAccept ? (
            /* AI suggestion task that can be accepted */
            <div className="flex justify-between">
              <button 
                className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground"
                onClick={onClose}
              >
                Close
              </button>
              
              <button 
                className="bg-primary rounded-lg px-4 py-2 text-sm text-primary-foreground"
                onClick={handleAccept}
              >
                Accept Quest
              </button>
            </div>
          ) : (
            /* Active task that can be completed */
            task.status === 'active' ? (
              <div className="flex justify-between">
                <button 
                  className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground"
                  onClick={onClose}
                >
                  Close
                </button>
                
                <button 
                  className="bg-primary rounded-lg px-4 py-2 text-sm text-primary-foreground"
                  onClick={handleCompleteTask}
                  disabled={completeTask.isPending}
                >
                  {completeTask.isPending ? 'Completing...' : 'Complete Quest'}
                </button>
              </div>
            ) : (
              /* Completed or failed task that can only be closed */
              <button 
                className="w-full bg-muted rounded-lg px-4 py-2 text-sm text-foreground"
                onClick={onClose}
              >
                Close
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}