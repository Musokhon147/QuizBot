const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface Question {
  id: string;
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  difficulty?: "easy" | "medium" | "hard";
}

export interface Test {
  id: string;
  telegram_user_id: string;
  title: string;
  category: string | null;
  created_at: string;
  questions: Question[];
}

export interface TestListItem {
  id: string;
  title: string;
  category: string | null;
  created_at: string;
  questions: { count: number }[];
}

export interface ResultDetail {
  questionNumber: number;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface SubmitResult {
  resultId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  details: ResultDetail[];
}

export interface TgUser {
  id: number | string;
  first_name: string;
  username?: string;
  last_name?: string;
}

export interface LeaderboardEntry {
  telegram_id: string;
  name: string | null;
  username: string | null;
  attempts: number;
  total_correct: number;
  avg_pct: number;
  score_index: number;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body || res.statusText}`);
  }
  return res.json();
}

export function authUser(payload: {
  telegramUserId: string;
  name?: string;
  username?: string;
  phone?: string;
}) {
  return jsonFetch(`${API_URL}/tests/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchTest(testId: string): Promise<Test> {
  return jsonFetch(`${API_URL}/tests/${testId}`);
}

export function fetchUserTests(telegramUserId: string): Promise<TestListItem[]> {
  return jsonFetch(`${API_URL}/tests/user/${telegramUserId}`);
}

export function submitTest(
  testId: string,
  telegramUserId: string,
  answers: (string | null)[],
  durationMs = 0
): Promise<SubmitResult> {
  return jsonFetch(`${API_URL}/tests/${testId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramUserId, answers, durationMs }),
  });
}

export function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return jsonFetch(`${API_URL}/tests/leaderboard?limit=${limit}`);
}

export function fetchStreak(telegramUserId: string): Promise<{ streak: number }> {
  return jsonFetch(`${API_URL}/tests/streak/${telegramUserId}`);
}

export function toggleBookmark(telegramUserId: string, questionId: string) {
  return jsonFetch(`${API_URL}/tests/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramUserId, questionId }),
  });
}

export function getTelegramUser(): TgUser {
  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return { id: "dev-user", first_name: "Dev" };
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

export function haptic(type: "light" | "medium" | "heavy" = "light") {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
}
