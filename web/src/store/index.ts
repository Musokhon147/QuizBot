import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AttemptRecord {
  id: string;
  testId: string;
  testTitle: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
  durationMs: number;
  category?: string;
}

export interface QuizConfig {
  timePerQuestion: number;
  questionCount: number | null;
  category: string | null;
}

interface AppState {
  userId: string;
  userName: string;
  language: string;
  theme: "dark" | "light" | "auto";
  attempts: AttemptRecord[];
  bookmarks: string[];
  quizConfig: QuizConfig;

  setUser: (id: string, name: string) => void;
  setLanguage: (lang: string) => void;
  setTheme: (theme: "dark" | "light" | "auto") => void;
  addAttempt: (attempt: AttemptRecord) => void;
  toggleBookmark: (questionId: string) => void;
  isBookmarked: (questionId: string) => boolean;
  setQuizConfig: (config: Partial<QuizConfig>) => void;
  getStreak: () => number;
  getAvgScore: () => number;
  getTotalCorrect: () => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: "",
      userName: "",
      language: "uz",
      theme: "light",
      attempts: [],
      bookmarks: [],
      quizConfig: {
        timePerQuestion: 30,
        questionCount: null,
        category: null,
      },

      setUser: (id, name) => set({ userId: id, userName: name }),

      setLanguage: (lang) => set({ language: lang }),

      setTheme: (theme) => set({ theme }),

      addAttempt: (attempt) =>
        set((s) => ({ attempts: [attempt, ...s.attempts].slice(0, 100) })),

      toggleBookmark: (questionId) =>
        set((s) => {
          const exists = s.bookmarks.includes(questionId);
          return {
            bookmarks: exists
              ? s.bookmarks.filter((id) => id !== questionId)
              : [...s.bookmarks, questionId],
          };
        }),

      isBookmarked: (questionId) => get().bookmarks.includes(questionId),

      setQuizConfig: (config) =>
        set((s) => ({ quizConfig: { ...s.quizConfig, ...config } })),

      getStreak: () => {
        const attempts = get().attempts;
        if (attempts.length === 0) return 0;

        const days = new Set(
          attempts.map((a) => new Date(a.date).toDateString())
        );
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          if (days.has(d.toDateString())) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      },

      getAvgScore: () => {
        const attempts = get().attempts;
        if (attempts.length === 0) return 0;
        const sum = attempts.reduce((s, a) => s + a.percentage, 0);
        return Math.round(sum / attempts.length);
      },

      getTotalCorrect: () => {
        return get().attempts.reduce((s, a) => s + a.score, 0);
      },
    }),
    {
      name: "testbot-storage",
      version: 1,
    }
  )
);
