import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAirtable } from '@/hooks/useAirtable';
import { useMistralAI } from '@/hooks/useMistralAI';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface CreateTaskModalProps {
  onClose: () => void;
}

const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  expirationHours: z.coerce.number().min(0).max(72),
  expirationMinutes: z.coerce.number().min(1).max(59).optional().default(30),
  proofType: z.enum(["photo", "text"])
});

type FormValues = z.infer<typeof createTaskSchema>;

export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const { useCreateTask } = useAirtable();
  const createTask = useCreateTask();
  const { analyzeDifficulty } = useMistralAI();
  const [analyzing, setAnalyzing] = useState(false);
  const { playSound } = useSound();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "medium",
      expirationHours: 0,
      expirationMinutes: 30,
      proofType: "photo"
    }
  });

  const handleClose = () => {
    playSound('buttonClick');
    onClose();
  };

  const onSubmit = async (data: FormValues) => {
    try {
      playSound('buttonClick');
      setAnalyzing(true);

      // Calculate expiration time
      const totalMinutes = (data.expirationHours * 60) + data.expirationMinutes;
      const expiresAt = new Date(Date.now() + totalMinutes * 60 * 1000);

      // Set XP reward based on difficulty
      let difficulty = data.difficulty;
      let xpReward = 50; // Default for easy

      if (difficulty === "medium") {
        xpReward = 150;
      } else if (difficulty === "hard") {
        xpReward = 300;
      }

      // Auto-set failure penalty based on difficulty
      // Easy tasks lose XP, medium and hard tasks lose credits
      const failurePenalty: { type: "xp" | "credits"; amount: number } = {
        type: difficulty === "easy" ? "xp" : "credits",
        amount: difficulty === "easy" ? 25 : (difficulty === "medium" ? 20 : 35)
      };

      // Make sure the user is logged in
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a quest. Please log in and try again.",
          variant: "destructive"
        });
        return;
      }

      // Create the task with auto-generated failure penalty and additional fields
      await createTask.mutateAsync({
        title: data.title,
        description: data.description,
        difficulty,
        xpReward,
        proofType: data.proofType,
        expiresAt,
        createdBy: "user",
        category: "user-created",
        failurePenalty
        // Server will handle adding the userId from the authenticated user
      });

      toast({
        title: "Quest Created!",
        description: "Your new quest has been created successfully.",
      });

      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create quest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/90">
      <div className="glass-panel rounded-xl p-6 max-w-sm w-full border border-primary/30 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-background z-10 pb-2">
          <h3 className="font-rajdhani font-bold text-xl text-foreground">Create New Quest</h3>
          <button 
            className="text-muted-foreground bg-muted rounded-full p-1 hover:bg-primary/10" 
            onClick={handleClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Quest Title</label>
            <input 
              type="text" 
              className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none" 
              placeholder="Enter quest title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description</label>
            <textarea 
              className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none h-24" 
              placeholder="Describe your quest"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className={`bg-muted rounded-lg px-2 py-2 text-sm border ${
                  form.watch("difficulty") === "easy" 
                    ? "text-[#22C55E] border-[#22C55E]/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("difficulty", "easy")}
              >
                <span className="flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                  Easy
                </span>
              </button>
              <button
                type="button"
                className={`bg-muted rounded-lg px-2 py-2 text-sm border ${
                  form.watch("difficulty") === "medium" 
                    ? "text-[#F59E0B] border-[#F59E0B]/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("difficulty", "medium")}
              >
                <span className="flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="15" x2="16" y2="15"></line>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                  Medium
                </span>
              </button>
              <button
                type="button"
                className={`bg-muted rounded-lg px-2 py-2 text-sm border ${
                  form.watch("difficulty") === "hard" 
                    ? "text-[#EF4444] border-[#EF4444]/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("difficulty", "hard")}
              >
                <span className="flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                  Hard
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Expiration</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input 
                  type="number" 
                  className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none" 
                  placeholder="Hours"
                  min={0}
                  max={72}
                  {...form.register("expirationHours")}
                />
                {form.formState.errors.expirationHours && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.expirationHours.message}</p>
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="number" 
                  className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none" 
                  placeholder="Minutes"
                  min={0}
                  max={59}
                  {...form.register("expirationMinutes")}
                />
                {form.formState.errors.expirationMinutes && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.expirationMinutes.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Proof Required</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`bg-muted rounded-lg px-4 py-2 text-sm border ${
                  form.watch("proofType") === "photo" 
                    ? "text-foreground border-primary/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("proofType", "photo")}
              >
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Photo
                </span>
              </button>
              <button
                type="button"
                className={`bg-muted rounded-lg px-4 py-2 text-sm border ${
                  form.watch("proofType") === "text" 
                    ? "text-foreground border-primary/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("proofType", "text")}
              >
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="17" y1="10" x2="3" y2="10" />
                    <line x1="21" y1="6" x2="3" y2="6" />
                    <line x1="21" y1="14" x2="3" y2="14" />
                    <line x1="17" y1="18" x2="3" y2="18" />
                  </svg>
                  Text
                </span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                <strong>Failure penalties</strong> are automatically set based on the difficulty:
                <ul className="mt-1 ml-5 list-disc text-xs">
                  <li>Easy: Lose 25 XP</li>
                  <li>Medium: Lose 20 Credits</li>
                  <li>Hard: Lose 35 Credits</li>
                </ul>
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="bg-primary w-full rounded-lg px-4 py-3 text-sm text-white font-medium"
            disabled={createTask.isPending || analyzing}
          >
            {createTask.isPending || analyzing ? 'Creating...' : 'Create Quest'}
          </button>
        </form>
      </div>
    </div>
  );
}