import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { FontsProvider } from "./components/ui/fonts";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import Home from "@/pages/home";
import Quests from "@/pages/quests";
import Achievements from "@/pages/achievements";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Modals
import { PunishmentModal } from "@/components/modals/PunishmentModal";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

function Router() {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [failedTask, setFailedTask] = useState<any>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { toast } = useToast();

  // Check if user is locked and get failed tasks
  useEffect(() => {
    if (user && user.isLocked) {
      setIsLocked(user.isLocked);
      
      // Get failed tasks
      const getFailedTasks = async () => {
        try {
          const tasksRes = await fetch("/api/tasks", {
            credentials: "include",
          });
          
          if (tasksRes.ok) {
            const tasks = await tasksRes.json();
            const failedTasks = tasks.filter((t: any) => t.status === "failed");
            
            if (failedTasks.length > 0) {
              // Get punishment options for the most recent failed task
              const latestFailedTask = failedTasks[0];
              const taskDetailsRes = await fetch(`/api/tasks/${latestFailedTask.id}`, {
                credentials: "include",
              });
              
              if (taskDetailsRes.ok) {
                const taskDetails = await taskDetailsRes.json();
                setFailedTask(taskDetails);
              }
            }
          }
        } catch (error) {
          console.error("Failed tasks fetch error:", error);
        }
      };
      
      getFailedTasks();
    } else {
      setIsLocked(false);
    }
  }, [user]);
  
  // Listen for websocket events
  useEffect(() => {
    if (!user) return;
    
    // Determine the WebSocket protocol based on the page URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket at:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "TASK_FAILED") {
          // Show notification and set app as locked
          toast({
            title: "Quest Failed!",
            description: `You failed to complete "${data.data.task.title}" in time.`,
            variant: "destructive",
          });
          
          setIsLocked(true);
          setFailedTask(data.data.task);
        } else if (data.type === "TASK_COMPLETED") {
          toast({
            title: "Quest Completed!",
            description: `You gained ${data.data.task.xpReward} XP!`,
          });
        } else if (data.type === "NEW_TASK") {
          toast({
            title: "New Quest Added!",
            description: `"${data.data.title}" has been added to your quests.`,
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [toast, user]);
  
  // Handle app lock when task fails
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isLocked]);

  return (
    <>
      <Switch>
        {/* Auth route - accessible to everyone */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Protected routes - only accessible when authenticated */}
        <ProtectedRoute path="/" component={Home} />
        <ProtectedRoute path="/quests" component={Quests} />
        <ProtectedRoute path="/achievements" component={Achievements} />
        <ProtectedRoute path="/profile" component={Profile} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      
      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal 
          onClose={() => setShowCreateTask(false)} 
        />
      )}
      
      {/* App-wide action handlers */}
      {user && (
        <div className="hidden">
          {/* This is a "controller" that app-wide components can access */}
          <button onClick={() => setShowCreateTask(true)} id="global-create-task" />
        </div>
      )}
      
      {/* Punishment Modal - shows when app is locked */}
      {isLocked && failedTask && (
        <PunishmentModal
          taskId={failedTask.id}
          taskTitle={failedTask.title}
          punishmentOptions={failedTask.punishmentOptions || []}
        />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FontsProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </FontsProvider>
    </QueryClientProvider>
  );
}

export default App;
