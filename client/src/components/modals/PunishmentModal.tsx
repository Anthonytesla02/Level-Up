import { useEffect } from 'react';
import { useAirtable } from '@/hooks/useAirtable';
import { useSound } from '@/hooks/useSound';
import { PunishmentOption } from '@shared/schema';

interface PunishmentModalProps {
  taskId: number;
  taskTitle: string;
  punishmentOptions: PunishmentOption[];
}

export function PunishmentModal({
  taskId,
  taskTitle,
  punishmentOptions,
}: PunishmentModalProps) {
  const { useApplyPunishment } = useAirtable();
  const applyPunishment = useApplyPunishment();
  const { playSound } = useSound();
  
  useEffect(() => {
    playSound('taskFailed');
  }, [playSound]);
  
  const handleSelectPunishment = (punishmentId: number) => {
    playSound('buttonClick');
    applyPunishment.mutate({ taskId, punishmentId });
  };
  
  // Helper to get punishment text
  const getPunishmentText = (type: string, value: string) => {
    if (type === 'xp') {
      return `-${value} XP`;
    } else if (type === 'xpass') {
      return `-${value} XP`;
    } else {
      return value;
    }
  };
  
  // Helper to get punishment icon
  const getPunishmentIcon = (type: string) => {
    if (type === 'xp') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-destructive mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        </svg>
      );
    } else if (type === 'xpass') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-primary mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-amber-500 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    }
  };
  
  // Helper to get punishment text color
  const getPunishmentTextColor = (type: string) => {
    if (type === 'xp') {
      return 'text-destructive';
    } else if (type === 'xpass') {
      return 'text-primary';
    } else {
      return 'text-amber-500';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 punishment-overlay">
      <div className="glass-panel rounded-xl p-6 max-w-sm w-full text-center border border-destructive/30 m-4">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4 border border-destructive/30">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-destructive">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        
        <h3 className="font-rajdhani font-bold text-xl text-destructive mb-2">
          QUEST FAILED!
        </h3>
        
        <p className="text-sm text-muted-foreground mb-6">
          You didn't complete "{taskTitle}" in time. Choose your punishment:
        </p>
        
        <div className="space-y-3 mb-6">
          {punishmentOptions.map((option) => (
            <button 
              key={option.id}
              onClick={() => handleSelectPunishment(option.id)}
              disabled={applyPunishment.isPending}
              className="bg-muted w-full rounded-lg px-4 py-3 text-sm text-foreground font-medium flex items-center justify-between"
            >
              <span className="flex items-center">
                {getPunishmentIcon(option.type)}
                {option.type === 'xp' ? 'Lose XP' : 
                 option.type === 'xpass' ? 'Pay XPass' : 'Physical Challenge'}
              </span>
              <span className={getPunishmentTextColor(option.type)}>
                {getPunishmentText(option.type, option.value)}
              </span>
            </button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground">
          App is locked until punishment is completed
        </p>
      </div>
    </div>
  );
}
