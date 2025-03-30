import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginSchema, registerSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side: Form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Solo Leveling</h1>
            <p className="text-muted-foreground mt-2">
              Your journey to self-improvement begins here
            </p>
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <LoginForm isSubmitting={loginMutation.isPending} onSubmit={loginMutation.mutate} />
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <RegisterForm isSubmitting={registerMutation.isPending} onSubmit={registerMutation.mutate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side: Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/10 flex-col items-center justify-center p-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Level Up Your Life</h2>
        <p className="text-lg mb-8 max-w-md">
          Set challenging quests, earn XP, and face consequences for failure. Transform your habits through gamified self-improvement.
        </p>
        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Complete Quests</h3>
            <p className="text-sm text-muted-foreground">Track your tasks and earn XP upon completion</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Face Consequences</h3>
            <p className="text-sm text-muted-foreground">Choose punishments for failed quests</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Unlock Achievements</h3>
            <p className="text-sm text-muted-foreground">Celebrate your progress with badges and rewards</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">Watch your level increase as you improve</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm({ 
  isSubmitting, 
  onSubmit 
}: { 
  isSubmitting: boolean;
  onSubmit: (values: LoginFormValues) => void;
}) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} autoComplete="current-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterForm({ 
  isSubmitting, 
  onSubmit 
}: { 
  isSubmitting: boolean;
  onSubmit: (values: RegisterFormValues) => void;
}) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>
    </Form>
  );
}