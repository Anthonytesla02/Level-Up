import { useState } from 'react';
import { apiRequest } from '../lib/queryClient';
import { Task } from '@shared/schema';

export function useMistralAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTask = async (
    difficulty: 'easy' | 'medium' | 'hard',
    category?: string
  ): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('GET', `/api/ai/suggest?difficulty=${difficulty}${category ? `&category=${category}` : ''}`);
      const data = await response.json();
      setLoading(false);
      
      if (data && data.length > 0) {
        // Return the first task suggestion
        return data[0];
      }
      
      return null;
    } catch (err) {
      setLoading(false);
      setError('Failed to generate AI task');
      console.error('Error generating AI task:', err);
      return null;
    }
  };

  const analyzeDifficulty = async (
    title: string,
    description: string
  ): Promise<{ difficulty: 'easy' | 'medium' | 'hard', xpReward: number } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/ai/analyze', {
        title,
        description
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (data && data.difficulty && data.xpReward) {
        return {
          difficulty: data.difficulty,
          xpReward: data.xpReward
        };
      }
      
      // If the API fails, make a best guess based on title/description length
      const totalLength = (title.length + description.length);
      
      if (totalLength < 50) {
        return { difficulty: 'easy', xpReward: 50 };
      } else if (totalLength < 100) {
        return { difficulty: 'medium', xpReward: 150 };
      } else {
        return { difficulty: 'hard', xpReward: 250 };
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to analyze task difficulty');
      console.error('Error analyzing task difficulty:', err);
      
      // Default to medium if there's an error
      return { difficulty: 'medium', xpReward: 150 };
    }
  };

  return {
    generateTask,
    analyzeDifficulty,
    loading,
    error
  };
}
