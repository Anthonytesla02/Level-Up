import { useAirtable } from '@/hooks/useAirtable';
import { Skeleton } from '@/components/ui/skeleton';

export function ProgressBar() {
  const { useUserStats } = useAirtable();
  const { data: stats, isLoading } = useUserStats();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  const { currentXp, nextLevelXp, xpPercentage } = stats;

  // Format XP numbers with commas
  const formattedCurrentXp = currentXp.toLocaleString();
  const formattedNextLevelXp = nextLevelXp.toLocaleString();

  return (
    <div className="glass-panel rounded-xl p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="font-rajdhani text-sm">
          <span className="text-muted-foreground">XP:</span>
          <span className="text-foreground font-medium ml-1">{formattedCurrentXp}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-muted-foreground">{formattedNextLevelXp}</span>
        </div>
        <div className="font-orbitron text-xs text-secondary">{xpPercentage}%</div>
      </div>
      <div className="xp-bar">
        <div className="xp-progress" style={{ width: `${xpPercentage}%` }}></div>
      </div>
    </div>
  );
}
