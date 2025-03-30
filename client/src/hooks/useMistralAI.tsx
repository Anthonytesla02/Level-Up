import { useState } from 'react';
import { apiRequest } from '../lib/queryClient';
import { Task } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMistralAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const generateTask = async (
    difficulty: 'easy' | 'medium' | 'hard',
    category?: string,
    isSpecialChallenge?: boolean
  ): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/ai/suggest?difficulty=${difficulty}`;
      
      if (category) {
        url += `&category=${category}`;
      }
      
      if (isSpecialChallenge) {
        url += `&special=true`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setLoading(false);
      
      return data || null;
    } catch (err) {
      setLoading(false);
      setError('Failed to generate AI task');
      console.error('Error generating AI task:', err);
      return null;
    }
  };

  // Use React Query for daily tasks generation
  const useGenerateDailyTasks = () => {
    return useMutation({
      mutationFn: async () => {
        const response = await fetch('/api/ai/daily-tasks');
        if (!response.ok) {
          throw new Error('Failed to generate daily tasks');
        }
        return response.json();
      },
      onSuccess: () => {
        // Invalidate all task-related queries when we generate new tasks
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/active'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ai/daily-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ai/daily-challenge'] });
      }
    });
  };

  // Get the special daily challenge
  const useDailyChallenge = () => {
    return useQuery({
      queryKey: ['/api/ai/daily-challenge'],
      retry: false
    });
  };

  // Fallback analysis function if we don't have a backend route for this
  const analyzeDifficulty = async (
    title: string,
    description: string
  ): Promise<{ difficulty: 'easy' | 'medium' | 'hard', xpReward: number }> => {
    // Make a best guess based on title/description length
    const totalLength = (title.length + description.length);
    
    if (totalLength < 50) {
      return { difficulty: 'easy', xpReward: 50 };
    } else if (totalLength < 100) {
      return { difficulty: 'medium', xpReward: 150 };
    } else {
      return { difficulty: 'hard', xpReward: 300 };
    }
  };

  return {
    generateTask,
    analyzeDifficulty,
    useGenerateDailyTasks,
    useDailyChallenge,
    loading,
    error
  };
}
