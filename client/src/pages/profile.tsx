import { useState } from 'react';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAirtable } from '@/hooks/useAirtable';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function Profile() {
  const { useUser, useAddXPass } = useAirtable();
  const { data: user, isLoading } = useUser();
  const addXPass = useAddXPass();
  const [showBuyXPass, setShowBuyXPass] = useState(false);
  const [xpassAmount, setXpassAmount] = useState(100);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const handleCreateTask = () => {
    // Use the global controller to open the create task modal
    const createTaskButton = document.getElementById('global-create-task');
    if (createTaskButton) {
      createTaskButton.click();
    }
  };
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setLocation('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleBuyXPass = () => {
    // In a real app, this would connect to a payment processor
    // For demo purposes, we'll just add the XPass without payment
    addXPass.mutate({ amount: xpassAmount }, {
      onSuccess: () => {
        toast({
          title: "XPass Added!",
          description: `${xpassAmount} XPass has been added to your account.`,
        });
        setShowBuyXPass(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add XPass. Please try again.",
          variant: "destructive"
        });
      }
    });
  };
  
  const getTitleText = (title: string) => {
    // Add some flavor text based on the title
    switch (title) {
      case 'Novice Challenger':
        return 'You are just starting your journey to self-improvement.';
      case 'Rising Hunter':
        return 'You are making steady progress on your path to greatness.';
      default:
        return 'Continue your journey to unlock more powerful titles.';
    }
  };

  return (
    <div className="max-w-md mx-auto relative">
      <main className="pb-20 px-4 pt-8">
        <h2 className="font-rajdhani font-bold text-2xl text-foreground mb-6">Profile</h2>
        
        {isLoading ? (
          <div className="glass-panel rounded-xl p-6 mb-6">
            <div className="flex items-center mb-6">
              <Skeleton className="h-20 w-20 rounded-lg mr-4" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-6" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : user ? (
          <div className="glass-panel rounded-xl p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center overflow-hidden mr-4">
                <span className="font-rajdhani font-bold text-2xl text-secondary">
                  {user.displayName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-rajdhani font-bold text-xl text-foreground">
                  {user.displayName}
                </h3>
                <div className="font-orbitron text-sm text-primary">
                  LEVEL {user.level}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{user.username}
                </div>
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-rajdhani font-semibold text-foreground">
                  Title: <span className="text-primary">{user.title}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {user.streak} day streak
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {getTitleText(user.title)}
              </p>
            </div>
            
            <button 
              className="bg-primary/20 w-full rounded-lg px-4 py-3 text-sm text-primary font-medium border border-primary/30 mb-3"
              onClick={() => setShowBuyXPass(true)}
            >
              Buy XPass Credits
            </button>
            
            <button 
              className="bg-muted w-full rounded-lg px-4 py-3 text-sm text-muted-foreground font-medium"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : null}
        
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-rajdhani font-semibold text-lg text-foreground mb-4">App Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Sound Effects</label>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary">
                <span data-state="checked" className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Notifications</label>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary">
                <span data-state="checked" className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Dark Mode</label>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                <span data-state="checked" className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0" />
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-primary/10">
            <div className="text-center text-xs text-muted-foreground">
              <p>Solo Leveling - Self Improvement App</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Buy XPass Modal */}
      {showBuyXPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90">
          <div className="glass-panel rounded-xl p-6 max-w-sm w-full border border-primary/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-rajdhani font-bold text-xl text-foreground">Buy XPass Credits</h3>
              <button 
                className="text-muted-foreground"
                onClick={() => setShowBuyXPass(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              XPass credits can be used to skip punishments when you fail to complete a quest.
            </p>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button 
                className={`rounded-lg py-3 text-sm font-medium ${xpassAmount === 100 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setXpassAmount(100)}
              >
                100
              </button>
              <button 
                className={`rounded-lg py-3 text-sm font-medium ${xpassAmount === 250 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setXpassAmount(250)}
              >
                250
              </button>
              <button 
                className={`rounded-lg py-3 text-sm font-medium ${xpassAmount === 500 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setXpassAmount(500)}
              >
                500
              </button>
            </div>
            
            <div className="bg-muted rounded-lg p-4 mb-6 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Amount:</div>
              <div className="font-orbitron text-lg text-secondary">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 inline mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {xpassAmount}
                </span>
              </div>
            </div>
            
            <button 
              className="bg-primary w-full rounded-lg px-4 py-3 text-sm text-white font-medium"
              onClick={handleBuyXPass}
              disabled={addXPass.isPending}
            >
              {addXPass.isPending ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      )}
      
      <BottomNavigation onCreateTask={handleCreateTask} />
    </div>
  );
}
