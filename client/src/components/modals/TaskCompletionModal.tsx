import { useEffect } from 'react';
import { useSound } from '@/hooks/useSound';

interface TaskCompletionModalProps {
  taskName: string;
  xpGained: number;
  xpPercentage: number;
  onClose: () => void;
}

export function TaskCompletionModal({ 
  taskName, 
  xpGained, 
  xpPercentage, 
  onClose 
}: TaskCompletionModalProps) {
  const { playSound } = useSound();
  
  useEffect(() => {
    playSound('taskComplete');
  }, [playSound]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 notification">
      <div className="glass-panel rounded-xl p-6 max-w-sm w-full text-center border border-primary/30 shadow-[0_0_15px_rgba(62,120,253,0.5)]">
        <div className="level-up">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="font-rajdhani font-bold text-xl text-foreground mb-2 glow-text">
            TASK COMPLETED!
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            You've gained <span className="text-primary font-orbitron">+{xpGained} XP</span> for completing "{taskName}"
          </p>
          
          <div className="xp-bar mb-4">
            <div className="xp-progress" style={{ width: `${xpPercentage}%` }}></div>
          </div>
          
          <button 
            className="bg-primary w-full rounded-lg px-4 py-3 text-sm text-white font-medium"
            onClick={onClose}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
