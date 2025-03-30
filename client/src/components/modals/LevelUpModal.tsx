import { useEffect } from 'react';
import { useSound } from '@/hooks/useSound';

interface LevelUpModalProps {
  newLevel: number;
  newTitle: string;
  onClose: () => void;
}

export function LevelUpModal({
  newLevel,
  newTitle,
  onClose
}: LevelUpModalProps) {
  const { playSound } = useSound();
  
  useEffect(() => {
    playSound('levelUp');
  }, [playSound]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 notification">
      <div className="glass-panel rounded-xl p-6 max-w-sm w-full text-center border border-primary/30 shadow-[0_0_15px_rgba(62,120,253,0.5)]">
        <div className="level-up">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/50 shadow-[0_0_15px_rgba(62,120,253,0.5)]">
            <div className="font-orbitron font-bold text-2xl text-secondary">
              {newLevel}
            </div>
          </div>
          
          <h3 className="font-rajdhani font-bold text-2xl text-foreground mb-2 glow-text">
            LEVEL UP!
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            You've reached <span className="text-secondary font-orbitron">Level {newLevel}</span> and unlocked a new title:
          </p>
          
          <div className="bg-muted rounded-lg px-4 py-3 mb-6">
            <span className="text-primary font-rajdhani font-semibold">
              "{newTitle}"
            </span>
          </div>
          
          <button 
            className="bg-primary w-full rounded-lg px-4 py-3 text-sm text-white font-medium"
            onClick={onClose}
          >
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  );
}
