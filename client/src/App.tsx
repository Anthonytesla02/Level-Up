import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { FontsProvider } from "./components/ui/fonts";

// Pages
import Home from "@/pages/home";
import Quests from "@/pages/quests";
import Achievements from "@/pages/achievements";
import Profile from "@/pages/profile";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import NotFound from "@/pages/not-found";

// Modals
import { PunishmentModal } from "@/components/modals/PunishmentModal";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [failedTask, setFailedTask] = useState<any>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.ok) {
          const user = await res.json();
          setIsAuthenticated(true);
          setIsLocked(user.isLocked);
          
          // If user is locked, check for failed tasks
          if (user.isLocked) {
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
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [location]);
  
  // Listen for websocket events
  useEffect(() => {
    // Determine the WebSocket protocol based on the page URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
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
  }, [toast]);
  
  // Handle app lock when task fails
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isLocked]);

  if (isAuthenticated === null) {
    // Loading state
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <>
      <Switch>
        {/* Auth routes */}
        {!isAuthenticated ? (
          <>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/*">
              {() => {
                // Redirect to login if not authenticated
                setLocation("/login");
                return null;
              }}
            </Route>
          </>
        ) : (
          <>
            {/* App routes - only accessible when authenticated */}
            <Route path="/" component={Home} />
            <Route path="/quests" component={Quests} />
            <Route path="/achievements" component={Achievements} />
            <Route path="/profile" component={Profile} />
            
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </>
        )}
      </Switch>
      
      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal 
          onClose={() => setShowCreateTask(false)} 
        />
      )}
      
      {/* App-wide action handlers */}
      {isAuthenticated && (
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
        <Router />
        <Toaster />
      </FontsProvider>
    </QueryClientProvider>
  );
}

export default App;
