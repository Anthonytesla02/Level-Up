import { useState } from 'react';
import { Task } from '@shared/schema';
import { useAirtable } from '@/hooks/useAirtable';
import { useSound } from '@/hooks/useSound';
import { formatDistanceToNow, format } from 'date-fns';
import { TaskCompletionModal } from '../modals/TaskCompletionModal';
import { useToast } from '@/hooks/use-toast';

interface TaskDetailScreenProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailScreen({ task, onClose }: TaskDetailScreenProps) {
  const [proof, setProof] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{taskName: string, xpGained: number, xpPercentage: number} | null>(null);
  
  const { useCompleteTask, useUserStats } = useAirtable();
  const completeTask = useCompleteTask();
  const { data: stats } = useUserStats();
  const { playSound } = useSound();
  const { toast } = useToast();

  // Calculate time remaining
  const timeRemaining = () => {
    try {
      return formatDistanceToNow(new Date(task.expiresAt), { addSuffix: false });
    } catch (err) {
      return "Unknown time";
    }
  };

  // Format created date
  const formattedCreatedDate = () => {
    try {
      return format(new Date(task.createdAt), 'MMM dd, yyyy');
    } catch (err) {
      return "Unknown date";
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

  const handleClose = () => {
    playSound('buttonClick');
    onClose();
  };

  const handleMarkCompleted = async () => {
    if (!proof) {
      toast({
        title: "Error",
        description: `Please provide ${task.proofType} proof of completion.`,
        variant: "destructive"
      });
      return;
    }

    try {
      playSound('buttonClick');
      const result = await completeTask.mutateAsync({
        taskId: task.id,
        proof
      });

      // Get completion data for modal
      if (result && stats) {
        setCompletionData({
          taskName: task.title,
          xpGained: task.xpReward,
          xpPercentage: stats.xpPercentage
        });
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete quest. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="px-4 pt-6 pb-20">
          <div className="flex items-center mb-6">
            <button className="mr-4" onClick={handleClose}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-foreground">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h2 className="font-rajdhani font-bold text-xl text-foreground">Quest Details</h2>
          </div>
          
          <div className="glass-panel rounded-xl p-5 mb-6 relative">
            <div 
              className={`absolute top-5 right-5 px-2 py-1 ${getDifficultyClass(task.difficulty)} text-xs rounded-lg font-medium`}
            >
              {task.difficulty.toUpperCase()}
            </div>
            
            <h3 className="font-rajdhani font-semibold text-lg mb-3 text-foreground pr-16">
              {task.title}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              {task.description}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-secondary mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-xs text-muted-foreground">Time Remaining</div>
                  <div className="text-sm text-foreground font-orbitron">
                    {timeRemaining()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-secondary mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <div>
                  <div className="text-xs text-muted-foreground">XP Reward</div>
                  <div className="text-sm text-secondary font-orbitron">
                    +{task.xpReward} XP
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-primary/10 pt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Required Proof: <span className="text-foreground">{task.proofType === 'photo' ? 'Photo Evidence' : 'Text Description'}</span>
              </div>
              
              {task.proofType === 'photo' ? (
                <div 
                  className="bg-muted rounded-lg border border-dashed border-primary/30 p-5 flex flex-col items-center justify-center mb-4 cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="photo-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        // Convert to base64 for demo purposes
                        // In a real app, you'd upload to a server
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target && event.target.result) {
                            setProof(event.target.result.toString());
                          }
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                  {proof ? (
                    <div className="w-full">
                      <img 
                        src={proof} 
                        alt="Proof" 
                        className="max-h-48 mx-auto rounded object-contain"
                      />
                      <p className="text-xs text-center mt-2 text-primary">Image uploaded. Tap to change.</p>
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-secondary mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <div className="text-sm text-foreground mb-1">Upload Proof</div>
                      <div className="text-xs text-muted-foreground">Tap to upload your completion proof</div>
                    </>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <textarea 
                    className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none h-24" 
                    placeholder="Describe how you completed this task..."
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <button 
              className="bg-primary w-full rounded-lg px-4 py-3 text-sm text-white font-medium"
              onClick={handleMarkCompleted}
              disabled={completeTask.isPending}
            >
              {completeTask.isPending ? 'Submitting...' : 'Mark as Completed'}
            </button>
          </div>
          
          <div className="glass-panel rounded-xl p-5 mb-6">
            <h4 className="font-rajdhani font-semibold text-base mb-3 text-foreground">Quest Details</h4>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span className="text-foreground">{task.createdBy === 'ai' ? 'Mistral AI' : 'You'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created On</span>
                <span className="text-foreground">{formattedCreatedDate()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failure Penalty</span>
                <span className="text-destructive">-{task.xpReward} XP or Physical Challenge</span>
              </div>
              
              {task.category && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-foreground">{task.category}</span>
                </div>
              )}
            </div>
          </div>
          
          {task.aiRecommendation && (
            <div className="glass-panel rounded-xl p-5">
              <h4 className="font-rajdhani font-semibold text-base mb-3 text-foreground">AI Recommendations</h4>
              
              <div className="text-sm text-muted-foreground">
                <p>{task.aiRecommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && completionData && (
        <TaskCompletionModal
          taskName={completionData.taskName}
          xpGained={completionData.xpGained}
          xpPercentage={completionData.xpPercentage}
          onClose={handleCompletionModalClose}
        />
      )}
    </>
  );
}
