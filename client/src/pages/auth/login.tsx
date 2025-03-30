import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/auth/login', data);
      
      if (response.ok) {
        // Login successful, redirect to home page
        setLocation('/');
      } else {
        const errorData = await response.json();
        toast({
          title: "Login Failed",
          description: errorData.message || "Invalid username or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const goToRegister = () => {
    setLocation('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full glass-panel rounded-xl p-6 border border-primary/30">
        <div className="text-center mb-8">
          <h1 className="font-rajdhani font-bold text-3xl text-foreground mb-2">SOLO LEVELING</h1>
          <p className="text-muted-foreground text-sm">Log in to continue your self-improvement journey</p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Username</label>
            <input 
              type="text" 
              className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none" 
              placeholder="Enter your username"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none" 
              placeholder="Enter your password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="bg-primary w-full rounded-lg px-4 py-3 text-sm text-white font-medium mt-6"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{' '}
            <button 
              className="text-primary hover:underline"
              onClick={goToRegister}
            >
              Register
            </button>
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-primary/10">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground">Powered by Mistral AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
