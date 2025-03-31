import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAirtable } from '@/hooks/useAirtable';
import { useMistralAI } from '@/hooks/useMistralAI';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';

interface CreateTaskModalProps {
  onClose: () => void;
}

const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  expirationHours: z.coerce.number().min(0).max(72),
  expirationMinutes: z.coerce.number().min(1).max(59).optional().default(30),
  proofType: z.enum(["photo", "text"]),
  failurePenaltyType: z.enum(["credits", "xp"]),
  failurePenaltyAmount: z.coerce.number().min(1).max(100)
});

type FormValues = z.infer<typeof createTaskSchema>;

export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const { useCreateTask } = useAirtable();
  const createTask = useCreateTask();
  const { analyzeDifficulty } = useMistralAI();
  const [analyzing, setAnalyzing] = useState(false);
  const { playSound } = useSound();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "medium",
      expirationHours: 0,
      expirationMinutes: 30,
      proofType: "photo",
      failurePenaltyType: "credits",
      failurePenaltyAmount: 20
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
      
      // If user selected difficulty, use it, otherwise analyze with AI
      let difficulty = data.difficulty;
      let xpReward = 50; // Default for easy
      
      // Set XP reward based on difficulty
      if (difficulty === "medium") {
        xpReward = 150;
      } else if (difficulty === "hard") {
        xpReward = 300;
      }
      
      // Create the task with failure penalty
      await createTask.mutateAsync({
        title: data.title,
        description: data.description,
        difficulty,
        xpReward,
        proofType: data.proofType,
        expiresAt,
        createdBy: "user",
        failurePenalty: {
          type: data.failurePenaltyType,
          amount: data.failurePenaltyAmount
        }
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
      <div className="glass-panel rounded-xl p-6 max-w-sm w-full border border-primary/30 m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-rajdhani font-bold text-xl text-foreground">Create New Quest</h3>
          <button className="text-muted-foreground" onClick={handleClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
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
                className={`bg-muted rounded-lg px-4 py-2 text-sm border ${
                  form.watch("difficulty") === "easy" 
                    ? "text-[#22C55E] border-[#22C55E]/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("difficulty", "easy")}
              >
                Easy
              </button>
              <button
                type="button"
                className={`bg-muted rounded-lg px-4 py-2 text-sm border ${
                  form.watch("difficulty") === "medium" 
                    ? "text-[#F59E0B] border-[#F59E0B]/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("difficulty", "medium")}
              >
                Medium
              </button>
              <button
                type="button"
                className={`bg-muted rounded-lg px-4 py-2 text-sm border ${
                  form.watch("difficulty") === "hard" 
                    ? "text-[#EF4444] border-[#EF4444]/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("difficulty", "hard")}
              >
                Hard
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
                Photo
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
                Text
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Failure Penalty</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                className={`bg-muted rounded-lg px-4 py-2 text-sm border ${
                  form.watch("failurePenaltyType") === "credits" 
                    ? "text-foreground border-primary/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("failurePenaltyType", "credits")}
              >
                Credits
              </button>
              <button
                type="button"
                className={`bg-muted rounded-lg px-4 py-2 text-sm border ${
                  form.watch("failurePenaltyType") === "xp" 
                    ? "text-foreground border-primary/30" 
                    : "text-muted-foreground border-transparent"
                }`}
                onClick={() => form.setValue("failurePenaltyType", "xp")}
              >
                XP
              </button>
            </div>
            <input 
              type="number" 
              className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground border border-primary/20 focus:border-primary focus:outline-none" 
              placeholder={`Enter ${form.watch("failurePenaltyType")} amount`}
              min={1}
              max={100}
              {...form.register("failurePenaltyAmount")}
            />
            {form.formState.errors.failurePenaltyAmount && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.failurePenaltyAmount.message}</p>
            )}
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
