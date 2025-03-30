import { useState } from 'react';
import { useAirtable } from '@/hooks/useAirtable';
import { QuestCard } from './QuestCard';
import { TaskDetailScreen } from '../tasks/TaskDetailScreen';
import { Task } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

export function ActiveQuests() {
  const { useActiveTasks } = useAirtable();
  const { data: tasks, isLoading } = useActiveTasks();
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
  };

  return (
    <>
      <h3 className="font-rajdhani font-semibold text-lg mb-3 text-foreground">Active Quests</h3>
      
      {isLoading ? (
        <div className="space-y-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-4 glass-panel">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-4 mb-8">
          {tasks.map((task) => (
            <QuestCard 
              key={task.id} 
              task={task} 
              onClick={handleTaskClick}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-xl p-8 text-center mb-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-10 h-10 mx-auto mb-3 text-muted-foreground"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" 
            />
          </svg>
          <p className="text-muted-foreground mb-2">No active quests</p>
          <p className="text-xs text-muted-foreground/70">
            Create a new quest or check out AI suggestions
          </p>
        </div>
      )}
      
      {selectedTask && (
        <TaskDetailScreen 
          task={selectedTask} 
          onClose={handleCloseTaskDetail} 
        />
      )}
    </>
  );
}
