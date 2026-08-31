export interface QuizAttempt {
  date: string;
  score: number;
  total: number;
  category: string;
}

export type QuizGameState = 'setup' | 'playing' | 'results';
