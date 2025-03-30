import { useAirtable } from '@/hooks/useAirtable';
import { Skeleton } from '@/components/ui/skeleton';

export function DailyStats() {
  const { useUserStats } = useAirtable();
  const { data: stats, isLoading } = useUserStats();
  const { useActiveTasks } = useAirtable();
  const { data: activeTasks, isLoading: isLoadingTasks } = useActiveTasks();

  if (isLoading || isLoadingTasks) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel rounded-xl p-3 text-center">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats || !activeTasks) return null;

  const { completed, streak } = stats;
  const available = activeTasks.length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="glass-panel rounded-xl p-3 text-center">
        <div className="text-secondary font-orbitron text-xl font-bold">
          {completed}
        </div>
        <div className="text-xs text-muted-foreground">Tasks Done</div>
      </div>
      
      <div className="glass-panel rounded-xl p-3 text-center">
        <div className="text-secondary font-orbitron text-xl font-bold">
          {streak}
        </div>
        <div className="text-xs text-muted-foreground">Day Streak</div>
      </div>
      
      <div className="glass-panel rounded-xl p-3 text-center">
        <div className="text-secondary font-orbitron text-xl font-bold">
          {available}
        </div>
        <div className="text-xs text-muted-foreground">Available</div>
      </div>
    </div>
  );
}
