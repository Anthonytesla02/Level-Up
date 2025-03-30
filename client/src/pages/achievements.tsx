import { useState, useEffect } from 'react';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAirtable } from '@/hooks/useAirtable';
import { Skeleton } from '@/components/ui/skeleton';
import { Achievement } from '@shared/schema';

export default function Achievements() {
  const { useAchievements } = useAirtable();
  const { data: achievements, isLoading } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  const handleCreateTask = () => {
    // Use the global controller to open the create task modal
    const createTaskButton = document.getElementById('global-create-task');
    if (createTaskButton) {
      createTaskButton.click();
    }
  };
  
  // Default achievements if none found
  const [defaultAchievements, setDefaultAchievements] = useState<any[]>([]);
  
  useEffect(() => {
    // Sample achievements for display if no real ones exist
    setDefaultAchievements([
      {
        id: 1,
        title: "First Blood",
        description: "Complete your first quest",
        unlockedAt: new Date().toISOString(),
        xpReward: 50
      },
      {
        id: 2,
        title: "Early Riser",
        description: "Complete a task before 8 AM",
        unlockedAt: new Date().toISOString(),
        xpReward: 100
      },
      {
        id: 3,
        title: "Streak Master",
        description: "Maintain a 7-day streak",
        unlockedAt: new Date().toISOString(),
        xpReward: 200
      }
    ]);
  }, []);
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return "Unknown date";
    }
  };
  
  const displayAchievements = achievements?.length ? achievements : defaultAchievements;

  return (
    <div className="max-w-md mx-auto relative">
      <main className="pb-20 px-4 pt-8">
        <h2 className="font-rajdhani font-bold text-2xl text-foreground mb-6">Achievements</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-xl p-4">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayAchievements.length > 0 ? (
          <div className="space-y-4">
            {displayAchievements.map((achievement) => (
              <div 
                key={achievement.id}
                className="glass-panel rounded-xl p-4 cursor-pointer"
                onClick={() => setSelectedAchievement(achievement)}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-rajdhani font-semibold text-lg text-foreground">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="flex items-center mt-1 text-xs">
                      <span className="text-secondary mr-3">+{achievement.xpReward} XP</span>
                      <span className="text-muted-foreground">Unlocked: {formatDate(achievement.unlockedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-muted-foreground">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
            <h3 className="font-rajdhani font-semibold text-lg text-foreground mb-2">No Achievements Yet</h3>
            <p className="text-sm text-muted-foreground">
              Complete quests and challenges to unlock achievements and earn rewards.
            </p>
          </div>
        )}
      </main>
      
      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90">
          <div className="glass-panel rounded-xl p-6 max-w-sm w-full border border-primary/30">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
            
            <h3 className="font-rajdhani font-bold text-xl text-foreground mb-2 text-center">
              {selectedAchievement.title}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6 text-center">
              {selectedAchievement.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-secondary font-orbitron text-lg font-bold">
                  +{selectedAchievement.xpReward}
                </div>
                <div className="text-xs text-muted-foreground">XP Reward</div>
              </div>
              
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-secondary font-orbitron text-lg font-bold">
                  {formatDate(selectedAchievement.unlockedAt)}
                </div>
                <div className="text-xs text-muted-foreground">Date Unlocked</div>
              </div>
            </div>
            
            <button 
              className="bg-primary w-full rounded-lg px-4 py-3 text-sm text-white font-medium"
              onClick={() => setSelectedAchievement(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <BottomNavigation onCreateTask={handleCreateTask} />
    </div>
  );
}
