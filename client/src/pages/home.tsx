import { useState, useEffect } from 'react';
import { UserStatusBar } from '@/components/home/UserStatusBar';
import { ProgressBar } from '@/components/home/ProgressBar';
import { DailyStats } from '@/components/home/DailyStats';
import { ActiveQuests } from '@/components/home/ActiveQuests';
import { AISuggested } from '@/components/home/AISuggested';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { useAirtable } from '@/hooks/useAirtable';

export default function Home() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number, title: string }>({ level: 1, title: "" });
  const { useUser } = useAirtable();
  const { data: user } = useUser();
  
  const handleCreateTask = () => {
    // Use the global controller to open the create task modal
    const createTaskButton = document.getElementById('global-create-task');
    if (createTaskButton) {
      createTaskButton.click();
    }
  };
  
  // Check for level ups - in a real app, this would come from WebSocket or API
  useEffect(() => {
    const checkForLevelUp = async () => {
      const levelUpLSKey = 'solo-leveling-last-level';
      
      // Check if user data is available
      if (user) {
        const lastLevel = localStorage.getItem(levelUpLSKey);
        
        // If we have a last level stored and it's less than current level, show level up
        if (lastLevel && parseInt(lastLevel) < user.level) {
          setLevelUpData({
            level: user.level,
            title: user.title
          });
          setShowLevelUp(true);
        }
        
        // Store current level
        localStorage.setItem(levelUpLSKey, user.level.toString());
      }
    };
    
    checkForLevelUp();
  }, [user]);
  
  const handleLevelUpClose = () => {
    setShowLevelUp(false);
  };

  return (
    <div className="max-w-md mx-auto relative">
      <main className="pb-20 px-4 pt-8">
        <UserStatusBar />
        <ProgressBar />
        <DailyStats />
        <ActiveQuests />
        <AISuggested />
      </main>
      
      <BottomNavigation onCreateTask={handleCreateTask} />
      
      {/* Level Up Modal */}
      {showLevelUp && (
        <LevelUpModal
          newLevel={levelUpData.level}
          newTitle={levelUpData.title}
          onClose={handleLevelUpClose}
        />
      )}
    </div>
  );
}
