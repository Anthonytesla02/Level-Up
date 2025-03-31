import { useState } from 'react';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAirtable } from '@/hooks/useAirtable';
import { Task } from '@shared/schema';
import { QuestCard } from '@/components/home/QuestCard';
import { TaskDetailScreen } from '@/components/tasks/TaskDetailScreen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';

export default function Quests() {
  const { useActiveTasks, useCompletedTasks, useTasks } = useAirtable();
  const { data: activeTasks = [] as Task[], isLoading: isLoadingActive } = useActiveTasks();
  const { data: completedTasks = [] as Task[], isLoading: isLoadingCompleted } = useCompletedTasks();
  const { data: allTasks = [] as Task[], isLoading: isLoadingAll } = useTasks();
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const handleCreateTask = () => {
    // Use the global controller to open the create task modal
    const createTaskButton = document.getElementById('global-create-task');
    if (createTaskButton) {
      createTaskButton.click();
    }
  };
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
  };
  
  // Get failed tasks
  const failedTasks = allTasks.filter((task: Task) => task.status === "failed");
  
  // Loading skeleton
  const QuestsSkeleton = () => (
    <div className="space-y-4 my-4">
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
  );
  
  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="glass-panel rounded-xl p-8 text-center my-4">
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
      <p className="text-muted-foreground mb-2">{message}</p>
      <p className="text-xs text-muted-foreground/70">
        Create a new quest to start leveling up
      </p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto relative">
      <main className="pb-20 px-4 pt-8">
        <h2 className="font-rajdhani font-bold text-2xl text-foreground mb-4">My Quests</h2>
        
        <Tabs defaultValue="active">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoadingActive ? (
              <QuestsSkeleton />
            ) : activeTasks && activeTasks.length > 0 ? (
              <div className="space-y-4 my-4">
                {activeTasks.slice(0, 3).map((task: Task) => (
                  <QuestCard 
                    key={task.id} 
                    task={task} 
                    onClick={handleTaskClick}
                  />
                ))}
                {activeTasks.length > 3 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p>Showing 3 of {activeTasks.length} active quests</p>
                    <p className="text-xs mt-1">Complete quests to view more</p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No active quests" />
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {isLoadingCompleted ? (
              <QuestsSkeleton />
            ) : completedTasks && completedTasks.length > 0 ? (
              <div className="space-y-4 my-4">
                {completedTasks.slice(0, 3).map((task: Task) => (
                  <QuestCard 
                    key={task.id} 
                    task={task} 
                    onClick={handleTaskClick}
                  />
                ))}
                {completedTasks.length > 3 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p>Showing 3 of {completedTasks.length} completed quests</p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No completed quests yet" />
            )}
          </TabsContent>
          
          <TabsContent value="failed">
            {isLoadingAll ? (
              <QuestsSkeleton />
            ) : failedTasks && failedTasks.length > 0 ? (
              <div className="space-y-4 my-4">
                {failedTasks.slice(0, 3).map((task: Task) => (
                  <QuestCard 
                    key={task.id} 
                    task={task} 
                    onClick={handleTaskClick}
                  />
                ))}
                {failedTasks.length > 3 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p>Showing 3 of {failedTasks.length} failed quests</p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No failed quests" />
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNavigation onCreateTask={handleCreateTask} />
      
      {selectedTask && (
        <TaskDetailScreen 
          task={selectedTask} 
          onClose={handleCloseTaskDetail} 
        />
      )}
    </div>
  );
}
